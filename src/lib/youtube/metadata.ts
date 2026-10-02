import { z } from "zod";
import type { VideoMetadata } from "@/types";
import { AppError } from "@/lib/utils/errors";
import { withCookiesArg, withTemporaryCookies } from "./cookies";
import { runProcess } from "./process";
import { YouTubeUrlSchema } from "./url";

const YtDlpMetadataSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  channel: z.string().min(1).optional(),
  uploader: z.string().min(1).optional(),
  duration: z.number().finite().nonnegative(),
  thumbnail: z.string().url().refine((value) => new URL(value).protocol === "https:", "A miniatura deve usar HTTPS.").optional(),
  webpage_url: z.string().url().optional(),
});

export function normalizeVideoMetadata(payload: unknown, fallbackUrl: string): VideoMetadata {
  const parsed = YtDlpMetadataSchema.safeParse(payload);
  if (!parsed.success) {
    throw new AppError("METADATA_EXTRACTION_FAILED", "Os dados retornados pelo vídeo são inválidos.");
  }
  return {
    videoId: parsed.data.id,
    title: parsed.data.title,
    channel: parsed.data.channel ?? parsed.data.uploader,
    duration: parsed.data.duration,
    thumbnail: parsed.data.thumbnail,
    url: parsed.data.webpage_url && YouTubeUrlSchema.safeParse(parsed.data.webpage_url).success
      ? YouTubeUrlSchema.parse(parsed.data.webpage_url).url
      : fallbackUrl,
  };
}

function mapMetadataFailure(error: AppError): AppError {
  if (error.code !== "METADATA_EXTRACTION_FAILED" || !error.details) return error;
  const details = error.details.toLowerCase();
  if (details.includes("private video") || details.includes("members-only")) {
    return new AppError("VIDEO_PRIVATE", "Este vídeo é privado ou exige acesso autorizado.");
  }
  if (details.includes("sign in") || details.includes("authentication")) {
    return new AppError("AUTH_REQUIRED", "O YouTube exige autenticação para acessar este vídeo.");
  }
  if (details.includes("video unavailable") || details.includes("not available")) {
    return new AppError("VIDEO_NOT_FOUND", "O vídeo não está disponível.");
  }
  return error;
}

export async function getVideoMetadata(inputUrl: string, cookiesText?: string): Promise<VideoMetadata> {
  const urlResult = YouTubeUrlSchema.safeParse(inputUrl);
  if (!urlResult.success) {
    throw new AppError("INVALID_URL", "Informe uma URL válida de vídeo do YouTube.");
  }
  const validated = urlResult.data;

  return withTemporaryCookies(cookiesText, async (cookiesPath) => {
    let result;
    try {
      result = await runProcess(
        "yt-dlp",
        withCookiesArg(["--dump-single-json", "--skip-download", "--no-playlist", validated.url], cookiesPath),
        { unavailableCode: "YTDLP_UNAVAILABLE" },
      );
    } catch (error) {
      if (error instanceof AppError) throw mapMetadataFailure(error);
      throw error;
    }

    try {
      return normalizeVideoMetadata(JSON.parse(result.stdout), validated.url);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("METADATA_EXTRACTION_FAILED", "Não foi possível interpretar os dados do vídeo.");
    }
  });
}
