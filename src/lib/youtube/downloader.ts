import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { AppError } from "@/lib/utils/errors";
import { withCookiesArg, writeCookiesFile } from "./cookies";
import { getYtDlpCommand } from "./tool-paths";
import { runProcess } from "./process";
import { YouTubeUrlSchema } from "./url";

function mapAudioFailure(error: AppError): AppError {
  if (
    error.code === "YTDLP_UNAVAILABLE"
    || error.code === "PROCESS_UNAVAILABLE"
    || error.code === "INVALID_URL"
    || error.code === "PROCESS_TIMEOUT"
    || error.code === "FFMPEG_UNAVAILABLE"
  ) {
    return error;
  }
  if (!error.details) {
    return new AppError("AUDIO_EXTRACTION_FAILED", "Não foi possível extrair o áudio do vídeo.", error.details);
  }
  const details = error.details.toLowerCase();
  if (details.includes("private video") || details.includes("members-only")) {
    return new AppError("VIDEO_PRIVATE", "Este vídeo é privado ou exige acesso autorizado.");
  }
  if (details.includes("sign in") || details.includes("authentication")) {
    return new AppError("AUTH_REQUIRED", "O YouTube exige autenticação para acessar este vídeo.");
  }
  if (
    details.includes("video unavailable")
    || details.includes("video not available")
    || details.includes("incomplete youtube id")
  ) {
    return new AppError("VIDEO_NOT_FOUND", "O vídeo não está disponível.");
  }
  return new AppError("AUDIO_EXTRACTION_FAILED", "Não foi possível extrair o áudio do vídeo.", error.details);
}

async function findDownloadedAudio(jobDirectory: string): Promise<string> {
  const entries = await readdir(jobDirectory);
  const audioFile = entries.find((entry) => /\.(mp3|m4a|webm|opus|ogg|wav|flac|aac)$/i.test(entry));
  if (!audioFile) {
    throw new AppError("AUDIO_EXTRACTION_FAILED", "Nenhum arquivo de áudio foi gerado para este vídeo.");
  }
  return join(jobDirectory, audioFile);
}

/** Downloads audio only into the job directory. Caller owns cleanup. */
export async function extractAudio(
  inputUrl: string,
  jobDirectory: string,
  cookiesText?: string,
): Promise<string> {
  const urlResult = YouTubeUrlSchema.safeParse(inputUrl);
  if (!urlResult.success) {
    throw new AppError("INVALID_URL", "Informe uma URL válida de vídeo do YouTube.");
  }

  const cookiesPath = cookiesText?.trim()
    ? await writeCookiesFile(jobDirectory, cookiesText)
    : undefined;

  try {
    await runProcess(
      getYtDlpCommand(),
      withCookiesArg([
        "-f", "bestaudio/bestaudio*/best",
        "--no-playlist",
        "--no-warnings",
        "-o", "source.%(ext)s",
        "--paths", jobDirectory,
        urlResult.data.url,
      ], cookiesPath),
      {
        unavailableCode: "YTDLP_UNAVAILABLE",
        failureCode: "AUDIO_EXTRACTION_FAILED",
        failureMessage: "Não foi possível extrair o áudio do vídeo.",
        timeoutMs: 300_000,
      },
    );
  } catch (error) {
    if (error instanceof AppError) throw mapAudioFailure(error);
    throw error;
  }

  return findDownloadedAudio(jobDirectory);
}
