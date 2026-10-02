import { runProcess } from "./process";

/** Internal wrapper for the Phase 4 audio workflow. Arguments are never browser-provided. */
export async function normalizeAudio(inputPath: string, outputPath: string): Promise<void> {
  await runProcess("ffmpeg", [
    "-y",
    "-i", inputPath,
    "-ac", "1",
    "-ar", "16000",
    "-vn",
    "-codec:a", "libmp3lame",
    "-b:a", "64k",
    outputPath,
  ]);
}
