import { z } from "zod";
import { isAppError } from "@/lib/utils/errors";
import { buildChatMessages } from "@/lib/ai/context-builder";
import { getAIProvider } from "@/lib/ai/provider-factory";
import { AIProviderIdSchema } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 120;

const ChatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(100_000),
});

const TranscriptSegmentSchema = z.object({
  id: z.string().min(1).optional(),
  start: z.number().finite().nonnegative(),
  end: z.number().finite().nonnegative(),
  text: z.string().max(8_000),
}).refine((segment) => segment.end >= segment.start, {
  message: "O término do segmento deve ser posterior ao início.",
  path: ["end"],
});

const RequestSchema = z.object({
  provider: AIProviderIdSchema,
  apiKey: z.string().trim().min(1).max(512),
  model: z.string().trim().min(1).max(128),
  baseUrl: z.string().trim().url().optional(),
  videoTitle: z.string().trim().max(500).optional().default("Untitled video"),
  transcriptText: z.string().max(100_000).optional(),
  transcriptSegments: z.array(TranscriptSegmentSchema).max(50_000).optional(),
  messages: z.array(ChatMessageSchema).min(1).max(40),
}).superRefine((value, context) => {
  if (value.provider === "openai-compatible" && !value.baseUrl) {
    context.addIssue({
      code: "custom",
      path: ["baseUrl"],
      message: "Informe a base URL do endpoint OpenAI-compatible.",
    });
  }
  if (value.baseUrl && !value.baseUrl.startsWith("https://")) {
    context.addIssue({
      code: "custom",
      path: ["baseUrl"],
      message: "A base URL deve usar HTTPS.",
    });
  }
});

type StreamEvent =
  | { type: "delta"; text: string }
  | { type: "done" }
  | { type: "error"; code: string; message: string };

function encode(event: StreamEvent): string {
  return `${JSON.stringify(event)}\n`;
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ code: "CHAT_FAILED", message: "Envie um corpo JSON válido." }, { status: 400 });
  }

  const body = RequestSchema.safeParse(payload);
  if (!body.success) {
    const issue = body.error.issues[0];
    const path = issue?.path[0];
    if (path === "baseUrl") {
      return Response.json({ code: "INVALID_PROVIDER", message: issue.message }, { status: 400 });
    }
    if (path === "provider" || path === "model" || path === "apiKey") {
      return Response.json({ code: "INVALID_PROVIDER", message: "Informe provedor, modelo e chave de API válidos." }, { status: 400 });
    }
    if (path === "transcriptSegments") {
      return Response.json({
        code: "CHAT_FAILED",
        message: issue?.message ?? "Segmentos de transcrição inválidos para o chat.",
      }, { status: 400 });
    }
    return Response.json({ code: "CHAT_FAILED", message: "Mensagens de chat inválidas." }, { status: 400 });
  }

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder();
      const send = (event: StreamEvent) => {
        if (request.signal.aborted) return;
        controller.enqueue(encoder.encode(encode(event)));
      };
      const onAbort = () => {
        try { controller.close(); } catch { /* already closed */ }
      };
      request.signal.addEventListener("abort", onAbort, { once: true });

      void (async () => {
        try {
          const provider = getAIProvider(body.data.provider);
          const messages = buildChatMessages({
            videoTitle: body.data.videoTitle,
            transcriptText: body.data.transcriptText,
            transcriptSegments: body.data.transcriptSegments?.map((segment, index) => ({
              id: segment.id ?? `segment-${index + 1}`,
              start: segment.start,
              end: segment.end,
              text: segment.text,
            })),
            messages: body.data.messages,
          });

          for await (const event of provider.streamChat(messages, {
            apiKey: body.data.apiKey,
            model: body.data.model,
            baseUrl: body.data.baseUrl,
            signal: request.signal,
          })) {
            if (request.signal.aborted) return;
            send(event);
          }
          controller.close();
        } catch (error) {
          if (request.signal.aborted) return;
          if (isAppError(error)) {
            send({ type: "error", code: error.code, message: error.message });
            controller.close();
            return;
          }
          send({ type: "error", code: "CHAT_FAILED", message: "Não foi possível concluir o chat." });
          controller.close();
        } finally {
          request.signal.removeEventListener("abort", onAbort);
        }
      })();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
