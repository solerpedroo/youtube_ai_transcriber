import { afterEach, describe, expect, it, vi } from "vitest";
import { getFfmpegCommand, getFfprobeCommand, getYtDlpCommand } from "./tool-paths";

describe("tool-paths", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("prefers YTDLP_PATH from env", () => {
    vi.stubEnv("YTDLP_PATH", "/opt/bin/yt-dlp");
    expect(getYtDlpCommand()).toBe("/opt/bin/yt-dlp");
  });

  it("prefers FFMPEG_PATH from env", () => {
    vi.stubEnv("FFMPEG_PATH", "/opt/bin/ffmpeg");
    expect(getFfmpegCommand()).toBe("/opt/bin/ffmpeg");
  });

  it("prefers FFPROBE_PATH from env", () => {
    vi.stubEnv("FFPROBE_PATH", "/opt/bin/ffprobe");
    expect(getFfprobeCommand()).toBe("/opt/bin/ffprobe");
  });
});
