import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";
import type { Transcript, TranscriptSegment } from "@/types";
import { AppError } from "@/lib/utils/errors";
import { buildFullText, normalizeSubtitleSegments } from "./normalize-segments";
import { withCookiesArg, writeCookiesFile } from "./cookies";
import { runProcess } from "./process";
import type { SelectedSubtitle, SubtitleKind, SubtitleTrack } from "./subtitle-types";
import { createJobDirectory, removeJobDirectory } from "./temp";
import { YouTubeUrlSchema } from "./url";
import { parseVtt } from "./vtt";

const PREFERRED_LANGUAGES = ["pt", "pt-BR", "pt-PT", "en", "en-US", "en-GB"] as const;

const YtDlpSubtitleEntrySchema = z.object({
  ext: z.string().optional(),
  name: z.string().optional(),
}).passthrough();

const YtDlpSubtitleCatalogSchema = z.object({
  id: z.string().min(1),
  subtitles: z.record(z.string(), z.array(YtDlpSubtitleEntrySchema)).optional().default({}),
  automatic_captions: z.record(z.string(), z.array(YtDlpSubtitleEntrySchema)).optional().default({}),
});

export type SubtitlesResult = {
  videoId: string;
  available: SubtitleTrack[];
  selected: SelectedSubtitle | null;
  transcript: Pick<Transcript, "language" | "segments" | "fullText"> | null;
};

function mapSubtitleFailure(error: AppError): AppError {
  if (error.code === "YTDLP_UNAVAILABLE" || error.code === "PROCESS_UNAVAILABLE" || error.code === "INVALID_URL" || error.code === "PROCESS_TIMEOUT") {
    return error;
  }
  if (!error.details) {
    return new AppError("SUBTITLE_EXTRACTION_FAILED", error.message, error.details);
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
  return new AppError("SUBTITLE_EXTRACTION_FAILED", "Não foi possível extrair as legendas do vídeo.", error.details);
}

function languageScore(language: string): number {
  const index = PREFERRED_LANGUAGES.findIndex((preferred) => preferred.toLowerCase() === language.toLowerCase());
  return index === -1 ? PREFERRED_LANGUAGES.length + 1 : index;
}

function tracksFromCatalog(
  catalog: Record<string, Array<{ name?: string }>>,
  kind: SubtitleKind,
): SubtitleTrack[] {
  return Object.entries(catalog)
    .filter(([, formats]) => formats.length > 0)
    .map(([language, formats]) => ({
      language,
      name: formats.find((format) => format.name)?.name,
      kind,
    }));
}

export function listSubtitleTracks(payload: unknown): { videoId: string; available: SubtitleTrack[] } {
  const parsed = YtDlpSubtitleCatalogSchema.safeParse(payload);
  if (!parsed.success) {
    throw new AppError("SUBTITLE_EXTRACTION_FAILED", "Os dados de legendas retornados são inválidos.");
  }

  const manual = tracksFromCatalog(parsed.data.subtitles, "manual");
  const automatic = tracksFromCatalog(parsed.data.automatic_captions, "auto");
  const available = [...manual, ...automatic].sort((left, right) => {
    if (left.kind !== right.kind) return left.kind === "manual" ? -1 : 1;
    return languageScore(left.language) - languageScore(right.language) || left.language.localeCompare(right.language);
  });

  return { videoId: parsed.data.id, available };
}

export function selectSubtitleTrack(
  available: readonly SubtitleTrack[],
  preferredLanguage?: string,
): SelectedSubtitle | null {
  if (available.length === 0) return null;

  if (preferredLanguage) {
    const preferred = preferredLanguage.toLowerCase();
    const exactManual = available.find((track) => track.kind === "manual" && track.language.toLowerCase() === preferred);
    if (exactManual) return { language: exactManual.language, kind: exactManual.kind };
    const prefixManual = available.find((track) => track.kind === "manual" && track.language.toLowerCase().startsWith(preferred));
    if (prefixManual) return { language: prefixManual.language, kind: prefixManual.kind };
    const exactAuto = available.find((track) => track.kind === "auto" && track.language.toLowerCase() === preferred);
    if (exactAuto) return { language: exactAuto.language, kind: exactAuto.kind };
    const prefixAuto = available.find((track) => track.kind === "auto" && track.language.toLowerCase().startsWith(preferred));
    if (prefixAuto) return { language: prefixAuto.language, kind: prefixAuto.kind };
  }

  const firstManual = available.find((track) => track.kind === "manual");
  if (firstManual) return { language: firstManual.language, kind: firstManual.kind };
  const firstAuto = available.find((track) => track.kind === "auto");
  return firstAuto ? { language: firstAuto.language, kind: firstAuto.kind } : null;
}

export function segmentsToTranscriptPayload(
  segments: readonly TranscriptSegment[],
  language: string,
): Pick<Transcript, "language" | "segments" | "fullText"> {
  return {
    language,
    segments: [...segments],
    fullText: buildFullText(segments),
  };
}

async function readDownloadedVtt(jobDirectory: string): Promise<string> {
  const entries = await readdir(jobDirectory);
  const vttFile = entries.find((entry) => entry.toLowerCase().endsWith(".vtt"));
  if (!vttFile) {
    throw new AppError("SUBTITLES_NOT_FOUND", "Nenhuma legenda utilizável foi encontrada para este vídeo.");
  }
  return readFile(join(jobDirectory, vttFile), "utf8");
}

async function downloadSubtitleFile(
  url: string,
  selected: SelectedSubtitle,
  jobDirectory: string,
  cookiesPath?: string,
): Promise<string> {
  if (!/^[A-Za-z0-9._-]+$/.test(selected.language)) {
    throw new AppError("SUBTITLE_EXTRACTION_FAILED", "O idioma de legenda retornado é inválido.");
  }
  const writeFlag = selected.kind === "manual" ? "--write-subs" : "--write-auto-subs";
  try {
    await runProcess(
      "yt-dlp",
      withCookiesArg([
        "--skip-download",
        "--no-playlist",
        writeFlag,
        "--sub-langs", selected.language,
        "--sub-format", "vtt",
        "--convert-subs", "vtt",
        "-o", "subtitle.%(ext)s",
        "--paths", jobDirectory,
        url,
      ], cookiesPath),
      { unavailableCode: "YTDLP_UNAVAILABLE", timeoutMs: 120_000 },
    );
  } catch (error) {
    if (error instanceof AppError) throw mapSubtitleFailure(error);
    throw error;
  }
  return readDownloadedVtt(jobDirectory);
}

export async function detectSubtitleTracks(
  inputUrl: string,
  cookiesPath?: string,
): Promise<{ videoId: string; available: SubtitleTrack[] }> {
  const urlResult = YouTubeUrlSchema.safeParse(inputUrl);
  if (!urlResult.success) {
    throw new AppError("INVALID_URL", "Informe uma URL válida de vídeo do YouTube.");
  }

  let result;
  try {
    result = await runProcess(
      "yt-dlp",
      withCookiesArg(
        ["--dump-single-json", "--skip-download", "--no-playlist", urlResult.data.url],
        cookiesPath,
      ),
      { unavailableCode: "YTDLP_UNAVAILABLE" },
    );
  } catch (error) {
    if (error instanceof AppError) throw mapSubtitleFailure(error);
    throw error;
  }

  try {
    return listSubtitleTracks(JSON.parse(result.stdout));
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("SUBTITLE_EXTRACTION_FAILED", "Não foi possível interpretar as legendas disponíveis.");
  }
}

export async function extractSubtitles(
  inputUrl: string,
  preferredLanguage?: string,
  cookiesText?: string,
): Promise<SubtitlesResult> {
  const urlResult = YouTubeUrlSchema.safeParse(inputUrl);
  if (!urlResult.success) {
    throw new AppError("INVALID_URL", "Informe uma URL válida de vídeo do YouTube.");
  }

  const jobDirectory = await createJobDirectory();
  try {
    const cookiesPath = cookiesText?.trim()
      ? await writeCookiesFile(jobDirectory, cookiesText)
      : undefined;
    const detected = await detectSubtitleTracks(urlResult.data.url, cookiesPath);
    const selected = selectSubtitleTrack(detected.available, preferredLanguage);
    if (!selected) {
      return {
        videoId: detected.videoId,
        available: detected.available,
        selected: null,
        transcript: null,
      };
    }

    const vtt = await downloadSubtitleFile(urlResult.data.url, selected, jobDirectory, cookiesPath);
    const segments = normalizeSubtitleSegments(parseVtt(vtt));
    if (segments.length === 0) {
      throw new AppError("SUBTITLES_NOT_FOUND", "Nenhuma legenda utilizável foi encontrada para este vídeo.");
    }
    return {
      videoId: detected.videoId,
      available: detected.available,
      selected,
      transcript: segmentsToTranscriptPayload(segments, selected.language),
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("SUBTITLE_EXTRACTION_FAILED", "Não foi possível extrair as legendas do vídeo.");
  } finally {
    await removeJobDirectory(jobDirectory);
  }
}
