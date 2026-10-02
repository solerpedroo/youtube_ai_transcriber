import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { AppError } from "@/lib/utils/errors";
import { runProcess } from "@/lib/youtube/process";
import { DEFAULT_CHUNK_SECONDS, type AudioChunk } from "./types";

export type AudioChunkPlan = {
  index: number;
  startSeconds: number;
  endSeconds: number;
};

/** Pure planner used by tests and by the ffmpeg chunk writer. */
export function planAudioChunks(
  durationSeconds: number,
  chunkSeconds: number = DEFAULT_CHUNK_SECONDS,
): AudioChunkPlan[] {
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    throw new AppError("AUDIO_EXTRACTION_FAILED", "A duração do áudio é inválida para chunking.");
  }
  if (!Number.isFinite(chunkSeconds) || chunkSeconds <= 0) {
    throw new AppError("AUDIO_EXTRACTION_FAILED", "O tamanho do chunk de áudio é inválido.");
  }

  const plans: AudioChunkPlan[] = [];
  let start = 0;
  let index = 0;
  while (start < durationSeconds) {
    const end = Math.min(durationSeconds, start + chunkSeconds);
    plans.push({ index, startSeconds: start, endSeconds: end });
    start = end;
    index += 1;
  }
  return plans;
}

export async function chunkAudio(
  inputPath: string,
  outputDirectory: string,
  durationSeconds: number,
  chunkSeconds: number = DEFAULT_CHUNK_SECONDS,
): Promise<AudioChunk[]> {
  const plans = planAudioChunks(durationSeconds, chunkSeconds);
  await mkdir(outputDirectory, { recursive: true });

  const chunks: AudioChunk[] = [];
  for (const plan of plans) {
    const path = join(outputDirectory, `chunk-${String(plan.index).padStart(3, "0")}.mp3`);
    const length = plan.endSeconds - plan.startSeconds;
    await runProcess(
      "ffmpeg",
      [
        "-y",
        "-ss", String(plan.startSeconds),
        "-t", String(length),
        "-i", inputPath,
        "-ac", "1",
        "-ar", "16000",
        "-vn",
        "-codec:a", "libmp3lame",
        "-b:a", "64k",
        path,
      ],
      {
        unavailableCode: "FFMPEG_UNAVAILABLE",
        failureCode: "AUDIO_EXTRACTION_FAILED",
        failureMessage: "Não foi possível dividir o áudio em partes.",
        timeoutMs: 300_000,
      },
    );
    chunks.push({ ...plan, path });
  }
  return chunks;
}
