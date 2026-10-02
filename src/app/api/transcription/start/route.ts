import { z } from "zod";
import { isAppError } from "@/lib/utils/errors";
import { runTranscriptionPipeline } from "@/lib/transcription/pipeline";
import type { TranscriptionProgressEvent } from "@/lib/transcription/types";
import { TranscriptionProviderIdSchema } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 300;

const LanguageSchema = z.string().trim().regex(
  /^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})?$/,
  "Informe um código de idioma válido.",
);

const RequestSchema = z.object({
  url: z.string().trim().min(1).max(2_048),
  provider: TranscriptionProviderIdSchema,
  apiKey: z.string().trim().min(1).max(512),
  model: z.string().trim().min(1).max(128),
  language: LanguageSchema.optional(),
});

function encodeEvent(event: TranscriptionProgressEvent): string {
  return `${JSON.stringify(event)}\n`;
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ code: "INVALID_URL", message: "Envie um corpo JSON válido." }, { status: 400 });
  }

  const body = RequestSchema.safeParse(payload);
  if (!body.success) {
    const hasLanguageError = body.error.issues.some((issue) => issue.path[0] === "language");
    const hasProviderError = body.error.issues.some((issue) =>
      issue.path[0] === "provider" || issue.path[0] === "model" || issue.path[0] === "apiKey");
    if (hasLanguageError) {
      return Response.json({ code: "INVALID_LANGUAGE", message: "Informe um código de idioma válido." }, { status: 400 });
    }
    if (hasProviderError) {
      return Response.json({ code: "INVALID_PROVIDER", message: "Informe provedor, modelo e chave de API válidos." }, { status: 400 });
    }
    return Response.json({ code: "INVALID_URL", message: "Informe uma URL válida do YouTube." }, { status: 400 });
  }

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder();
      const send = (event: TranscriptionProgressEvent) => {
        controller.enqueue(encoder.encode(encodeEvent(event)));
      };

      void (async () => {
        try {
          const transcript = await runTranscriptionPipeline({
            url: body.data.url,
            provider: body.data.provider,
            apiKey: body.data.apiKey,
            model: body.data.model,
            language: body.data.language,
            onProgress: (event) => send(event),
          });
          send({ type: "complete", transcript });
          controller.close();
        } catch (error) {
          if (isAppError(error)) {
            send({ type: "error", code: error.code, message: error.message });
            controller.close();
            return;
          }
          send({ type: "error", code: "TRANSCRIPTION_FAILED", message: "Não foi possível concluir a transcrição." });
          controller.close();
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
