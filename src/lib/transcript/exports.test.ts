import { describe, expect, it } from "vitest";
import {
  exportTranscriptJson,
  exportTranscriptMarkdown,
  exportTranscriptSrt,
  exportTranscriptTxt,
  exportTranscriptVtt,
  slugifyFilename,
} from "./exports";

const input = {
  metadata: {
    videoId: "dQw4w9WgXcQ",
    title: "Sample Video",
    channel: "Example Channel",
    duration: 120,
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  },
  transcript: {
    id: "t1",
    videoId: "dQw4w9WgXcQ",
    language: "en",
    createdAt: "2026-10-02T00:00:00.000Z",
    fullText: "Hello world",
    segments: [
      { id: "s1", start: 0, end: 1.5, text: "Hello" },
      { id: "s2", start: 1.5, end: 3, text: "world" },
    ],
  },
};

describe("transcript exports", () => {
  it("builds plain text with timestamps", () => {
    expect(exportTranscriptTxt(input)).toContain("0:00 Hello");
    expect(exportTranscriptTxt(input)).toContain("URL: https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  });

  it("builds markdown sections", () => {
    expect(exportTranscriptMarkdown(input)).toContain("# Sample Video");
    expect(exportTranscriptMarkdown(input)).toContain("### 0:00");
  });

  it("builds json, srt and vtt", () => {
    expect(JSON.parse(exportTranscriptJson(input)).transcript.segments).toHaveLength(2);
    expect(exportTranscriptSrt(input.transcript)).toContain("00:00:00,000 --> 00:00:01,500");
    expect(exportTranscriptVtt(input.transcript).startsWith("WEBVTT")).toBe(true);
  });

  it("slugifies filenames safely", () => {
    expect(slugifyFilename("Hello / World??")).toBe("hello-world");
  });
});
