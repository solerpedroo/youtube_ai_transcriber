import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

function bundledYtDlpPath(): string | null {
  try {
    const { YOUTUBE_DL_PATH } = require("yt-dlp-exec/src/constants.js") as { YOUTUBE_DL_PATH: string };
    return typeof YOUTUBE_DL_PATH === "string" && YOUTUBE_DL_PATH.trim() ? YOUTUBE_DL_PATH : null;
  } catch {
    return null;
  }
}

function bundledFfmpegPath(): string | null {
  try {
    const path = require("ffmpeg-static") as string | null;
    return typeof path === "string" && path.trim() ? path : null;
  } catch {
    return null;
  }
}

function bundledFfprobePath(): string | null {
  try {
    const mod = require("ffprobe-static") as { path?: string };
    return typeof mod.path === "string" && mod.path.trim() ? mod.path : null;
  } catch {
    return null;
  }
}

/** Resolves yt-dlp: env `YTDLP_PATH`, then binary from `yt-dlp-exec`, then PATH. */
export function getYtDlpCommand(): string {
  return process.env.YTDLP_PATH?.trim() || bundledYtDlpPath() || "yt-dlp";
}

/** Resolves ffmpeg: env `FFMPEG_PATH`, then `ffmpeg-static`, then PATH. */
export function getFfmpegCommand(): string {
  return process.env.FFMPEG_PATH?.trim() || bundledFfmpegPath() || "ffmpeg";
}

/** Resolves ffprobe: env `FFPROBE_PATH`, then `ffprobe-static`, then PATH. */
export function getFfprobeCommand(): string {
  return process.env.FFPROBE_PATH?.trim() || bundledFfprobePath() || "ffprobe";
}
