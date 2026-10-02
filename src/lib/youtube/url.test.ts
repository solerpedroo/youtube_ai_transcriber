import { describe, expect, it } from "vitest";
import { normalizeVideoMetadata } from "./metadata";
import { YouTubeUrlSchema } from "./url";

describe("YouTubeUrlSchema", () => {
  it.each([
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "https://youtu.be/dQw4w9WgXcQ?t=10",
    "https://youtube.com/shorts/dQw4w9WgXcQ",
    "https://music.youtube.com/watch?v=dQw4w9WgXcQ",
  ])("accepts supported video URLs", (url) => {
    expect(YouTubeUrlSchema.safeParse(url).success).toBe(true);
  });

  it.each([
    "http://youtube.com/watch?v=dQw4w9WgXcQ",
    "https://youtube.com.evil.test/watch?v=dQw4w9WgXcQ",
    "https://attacker@youtube.com/watch?v=dQw4w9WgXcQ",
    "https://youtube.com:444/watch?v=dQw4w9WgXcQ",
    "https://example.com/watch?v=dQw4w9WgXcQ",
    "https://youtube.com/watch?v=short",
    "https://youtube.com/playlist?list=abc",
  ])("rejects unsupported or unsafe URLs", (url) => {
    expect(YouTubeUrlSchema.safeParse(url).success).toBe(false);
  });
});

describe("normalizeVideoMetadata", () => {
  it("maps only the DTO required by the browser", () => {
    expect(normalizeVideoMetadata({
      id: "dQw4w9WgXcQ",
      title: "A video",
      uploader: "Channel",
      duration: 212,
      thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
      webpage_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      privateToken: "must not leak",
    }, "https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toEqual({
      videoId: "dQw4w9WgXcQ",
      title: "A video",
      channel: "Channel",
      duration: 212,
      thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    });
  });

  it("does not expose a canonical URL outside the YouTube allowlist", () => {
    expect(normalizeVideoMetadata({
      id: "dQw4w9WgXcQ", title: "A video", duration: 212,
      webpage_url: "https://example.com/redirect",
    }, "https://www.youtube.com/watch?v=dQw4w9WgXcQ").url).toBe("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  });
});
