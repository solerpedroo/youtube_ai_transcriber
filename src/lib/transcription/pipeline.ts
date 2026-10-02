import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { AppError, isAppError } from "@/lib/utils/errors";
import type { TranscriptionProviderId } from "@/types";
import { extractAudio } from "@/lib/youtube/downloader";
import { normalizeAudio, probeAudioDurationSeconds } from "@/lib/youtube/ffmpeg";
import { createJobDirectory, removeJobDirectory } from "@/lib/youtube/temp";
import { chunkAudio } from "./chunk-audio";
import { mergeTranscriptChunks } from "./merge-transcripts";
import { getTranscriptionProvider } from "./providers";
import {
  DEFAULT_TRANSCRIPTION_CONCURRENCY,
  type TranscriptionOptions,
  type TranscriptionProgressEvent,
  type TranscriptionProvider,
  type TranscriptionResult,
} from "./types";

export type RunTranscriptionInput = {
  url: string;
  provider: TranscriptionProviderId;
  apiKey: string;
  model: string;
  language?: string;
  /** Netscape cookies.txt contents; never persisted — written only into the job temp dir. */
  cookies?: string;
  concurrency?: number;
  signal?: AbortSignal;
  onProgress?: (event: Extract<TranscriptionProgressEvent, { type: "status" }>) => void;
};

function assertNotAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new AppError("TRANSCRIPTION_FAILED", "A transcrição foi cancelada.");
  }
}

async function mapPool<T, R>(
  items: readonly T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  async function runWorker(): Promise<void> {
    while (nextIndex < items.length) {
      const current = nextIndex;
      nextIndex += 1;
      results[current] = await worker(items[current]!, current);
    }
  }

  const size = Math.max(1, Math.min(concurrency, items.length || 1));
  await Promise.all(Array.from({ length: size }, () => runWorker()));
  return results;
}

export async function runTranscriptionPipeline(input: RunTranscriptionInput): Promise<TranscriptionResult> {
  if (!input.apiKey.trim()) {
    throw new AppError("PROVIDER_AUTH_FAILED", "Informe a chave de API do provedor de transcrição.");
  }
  if (!input.model.trim()) {
    throw new AppError("INVALID_PROVIDER", "Informe o modelo de transcrição.");
  }

  const provider: TranscriptionProvider = getTranscriptionProvider(input.provider);
  const options: TranscriptionOptions = {
    apiKey: input.apiKey,
    model: input.model,
    language: input.language,
  };
  const emit = input.onProgress;
  const signal = input.signal;
  assertNotAborted(signal);
  const jobDirectory = await createJobDirectory();

  try {
    emit?.({ type: "status", status: "downloading_audio", message: "Baixando áudio do YouTube..." });
    const sourcePath = await extractAudio(input.url, jobDirectory, input.cookies);
    assertNotAborted(signal);

    emit?.({ type: "status", status: "processing_audio", message: "Normalizando áudio..." });
    const normalizedPath = join(jobDirectory, "audio.mp3");
    await normalizeAudio(sourcePath, normalizedPath);
    assertNotAborted(signal);
    const durationSeconds = await probeAudioDurationSeconds(normalizedPath);

    emit?.({ type: "status", status: "chunking_audio", message: "Dividindo áudio em partes..." });
    const chunksDirectory = join(jobDirectory, "chunks");
    await mkdir(chunksDirectory, { recursive: true });
    const chunks = await chunkAudio(normalizedPath, chunksDirectory, durationSeconds);
    assertNotAborted(signal);

    emit?.({
      type: "status",
      status: "transcribing",
      current: 0,
      total: chunks.length,
      message: `Transcrevendo 0/${chunks.length}...`,
    });

    let completed = 0;
    const chunkResults = await mapPool(
      chunks,
      input.concurrency ?? DEFAULT_TRANSCRIPTION_CONCURRENCY,
      async (chunk) => {
        assertNotAborted(signal);
        const result = await provider.transcribe(chunk.path, options, signal);
        completed += 1;
        emit?.({
          type: "status",
          status: "transcribing",
          current: completed,
          total: chunks.length,
          message: `Transcrevendo ${completed}/${chunks.length}...`,
        });
        return { offsetSeconds: chunk.startSeconds, result };
      },
    );

    assertNotAborted(signal);
    emit?.({ type: "status", status: "merging", message: "Unificando segmentos..." });
    const merged = mergeTranscriptChunks(chunkResults);
    if (merged.segments.length === 0) {
      throw new AppError("TRANSCRIPTION_FAILED", "A transcrição não retornou segmentos utilizáveis.");
    }
    return merged;
  } catch (error) {
    if (isAppError(error)) throw error;
    throw new AppError("TRANSCRIPTION_FAILED", "Não foi possível concluir a transcrição.");
  } finally {
    await removeJobDirectory(jobDirectory);
  }
}
