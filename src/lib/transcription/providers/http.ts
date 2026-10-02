import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { z } from "zod";
import { AppError } from "@/lib/utils/errors";
import type { TranscriptionOptions, TranscriptionResult } from "../types";

const WhisperSegmentSchema = z.object({
  start: z.number().finite().nonnegative(),
  end: z.number().finite().nonnegative(),
  text: z.string(),
}).refine((segment) => segment.end >= segment.start, {
  message: "O término do segmento deve ser posterior ao início.",
  path: ["end"],
});

const WhisperVerboseSchema = z.object({
  text: z.string().optional().default(""),
  language: z.string().optional(),
  segments: z.array(WhisperSegmentSchema).optional().default([]),
});

function mapProviderHttpError(status: number, bodyText: string): AppError {
  if (status === 401 || status === 403) {
    return new AppError("PROVIDER_AUTH_FAILED", "A chave de API do provedor de transcrição foi rejeitada.");
  }
  if (status === 429) {
    return new AppError("RATE_LIMITED", "O provedor de transcrição atingiu o limite de requisições.");
  }
  return new AppError(
    "TRANSCRIPTION_FAILED",
    "Não foi possível transcrever o áudio com o provedor selecionado.",
    bodyText.slice(0, 500),
  );
}

export async function transcribeWithOpenAiCompatibleApi(
  endpoint: string,
  filePath: string,
  options: TranscriptionOptions,
  signal?: AbortSignal,
): Promise<TranscriptionResult> {
  if (signal?.aborted) {
    throw new AppError("TRANSCRIPTION_FAILED", "A transcrição foi cancelada.");
  }

  const bytes = await readFile(filePath);
  const form = new FormData();
  form.append(
    "file",
    new Blob([Uint8Array.from(bytes)], { type: "audio/mpeg" }),
    basename(filePath) || "chunk.mp3",
  );
  form.append("model", options.model);
  form.append("response_format", "verbose_json");
  form.append("timestamp_granularities[]", "segment");
  if (options.language) form.append("language", options.language);

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${options.apiKey}`,
      },
      body: form,
      signal,
    });
  } catch (error) {
    if (signal?.aborted || (error instanceof Error && error.name === "AbortError")) {
      throw new AppError("TRANSCRIPTION_FAILED", "A transcrição foi cancelada.");
    }
    throw new AppError("TRANSCRIPTION_FAILED", "Não foi possível contatar o provedor de transcrição.");
  }

  const bodyText = await response.text();
  if (!response.ok) {
    throw mapProviderHttpError(response.status, bodyText);
  }

  let payload: unknown;
  try {
    payload = JSON.parse(bodyText);
  } catch {
    throw new AppError("TRANSCRIPTION_FAILED", "A resposta do provedor de transcrição é inválida.");
  }

  const parsed = WhisperVerboseSchema.safeParse(payload);
  if (!parsed.success) {
    throw new AppError("TRANSCRIPTION_FAILED", "A resposta do provedor de transcrição é inválida.");
  }

  const segments = parsed.data.segments.map((segment, index) => ({
    id: `provider-${index + 1}`,
    start: segment.start,
    end: segment.end,
    text: segment.text.trim(),
  })).filter((segment) => segment.text.length > 0);

  const fullText = parsed.data.text.trim() || segments.map((segment) => segment.text).join(" ").trim();
  return {
    language: parsed.data.language,
    segments,
    fullText,
  };
}
