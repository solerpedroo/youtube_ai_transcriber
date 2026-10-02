import { z } from "zod";

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtu.be",
]);

const YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]{6,}$/;

export type ValidatedYouTubeUrl = {
  url: string;
  videoId: string;
};

function parseYouTubeUrl(value: string): ValidatedYouTubeUrl | null {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }

  if (
    url.protocol !== "https:"
    || url.username
    || url.password
    || url.port
    || !YOUTUBE_HOSTS.has(url.hostname.toLowerCase())
  ) {
    return null;
  }

  const host = url.hostname.toLowerCase();
  const pathParts = url.pathname.split("/").filter(Boolean);
  const videoId = host === "youtu.be"
    ? pathParts[0]
    : url.pathname === "/watch"
      ? url.searchParams.get("v") ?? undefined
      : ["shorts", "live", "embed"].includes(pathParts[0] ?? "")
        ? pathParts[1]
        : undefined;

  if (!videoId || !YOUTUBE_ID_PATTERN.test(videoId)) return null;

  return { url: url.toString(), videoId };
}

export const YouTubeUrlSchema = z.string().trim().min(1).transform((value, context) => {
  const parsed = parseYouTubeUrl(value);
  if (!parsed) {
    context.addIssue({
      code: "custom",
      message: "Informe uma URL válida de vídeo do YouTube.",
    });
    return z.NEVER;
  }
  return parsed;
});

export function validateYouTubeUrl(value: string): ValidatedYouTubeUrl {
  return YouTubeUrlSchema.parse(value);
}
