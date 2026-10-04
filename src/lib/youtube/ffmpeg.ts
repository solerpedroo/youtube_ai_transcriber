import { access } from "node:fs/promises";
import { AppError } from "@/lib/utils/errors";
import { runProcess } from "./process";
import { getFfmpegCommand, getFfprobeCommand } from "./tool-paths";

/** Internal wrapper for the Phase 4 audio workflow. Arguments are never browser-provided. */
export async function normalizeAudio(inputPath: string, outputPath: string): Promise<void> {
  await runProcess(
    getFfmpegCommand(),
    [
      "-y",
      "-i", inputPath,
      "-ac", "1",
      "-ar", "16000",
      "-vn",
      "-codec:a", "libmp3lame",
      "-b:a", "64k",
      outputPath,
    ],
    {
      unavailableCode: "FFMPEG_UNAVAILABLE",
      failureCode: "AUDIO_EXTRACTION_FAILED",
      failureMessage: "Não foi possível normalizar o áudio do vídeo.",
      timeoutMs: 300_000,
    },
  );
}

export async function probeAudioDurationSeconds(filePath: string): Promise<number> {
  try {
    await access(filePath);
  } catch {
    throw new AppError("AUDIO_EXTRACTION_FAILED", "Arquivo de áudio não encontrado para medição de duração.");
  }

  const result = await runProcess(
    getFfprobeCommand(),
    ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", filePath],
    {
      unavailableCode: "FFMPEG_UNAVAILABLE",
      failureCode: "AUDIO_EXTRACTION_FAILED",
      failureMessage: "Não foi possível determinar a duração do áudio.",
    },
  );

  const duration = Number.parseFloat(result.stdout.trim());
  if (!Number.isFinite(duration) || duration <= 0) {
    throw new AppError("AUDIO_EXTRACTION_FAILED", "A duração do áudio retornada é inválida.");
  }
  return duration;
}
