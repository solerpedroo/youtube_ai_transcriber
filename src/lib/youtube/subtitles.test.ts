import { describe, expect, it } from "vitest";
import {
  listSubtitleTracks,
  segmentsToTranscriptPayload,
  selectSubtitleTrack,
} from "./subtitles";
import { normalizeSubtitleSegments } from "./normalize-segments";

describe("listSubtitleTracks", () => {
  it("prefers manual tracks and ranks Portuguese and English first", () => {
    const result = listSubtitleTracks({
      id: "dQw4w9WgXcQ",
      subtitles: {
        fr: [{ ext: "vtt", name: "French" }],
        pt: [{ ext: "vtt", name: "Portuguese" }],
      },
      automatic_captions: {
        en: [{ ext: "vtt" }],
        es: [{ ext: "vtt" }],
      },
    });

    expect(result.videoId).toBe("dQw4w9WgXcQ");
    expect(result.available.map((track) => `${track.kind}:${track.language}`)).toEqual([
      "manual:pt",
      "manual:fr",
      "auto:en",
      "auto:es",
    ]);
  });
});

describe("selectSubtitleTrack", () => {
  const available = listSubtitleTracks({
    id: "abc",
    subtitles: { en: [{ ext: "vtt" }] },
    automatic_captions: { "pt-BR": [{ ext: "vtt" }], en: [{ ext: "vtt" }] },
  }).available;

  it("chooses manual tracks before automatic captions", () => {
    expect(selectSubtitleTrack(available)).toEqual({ language: "en", kind: "manual" });
  });

  it("honors a preferred language including prefix matches", () => {
    expect(selectSubtitleTrack(available, "pt")).toEqual({ language: "pt-BR", kind: "auto" });
  });

  it("returns null when nothing is available", () => {
    expect(selectSubtitleTrack([])).toBeNull();
  });
});

describe("segmentsToTranscriptPayload", () => {
  it("builds the transcript DTO used by the API", () => {
    const segments = normalizeSubtitleSegments([
      { start: 0, end: 1, text: "Hello" },
      { start: 1, end: 2, text: "world" },
    ]);
    expect(segmentsToTranscriptPayload(segments, "en")).toEqual({
      language: "en",
      segments,
      fullText: "Hello world",
    });
  });
});

describe("listSubtitleTracks validation", () => {
  it("rejects catalogs without a video id", () => {
    expect(() => listSubtitleTracks({ subtitles: { en: [{ ext: "vtt" }] } })).toThrowError(
      expect.objectContaining({ code: "SUBTITLE_EXTRACTION_FAILED" }),
    );
  });
});
