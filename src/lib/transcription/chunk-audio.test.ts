import { describe, expect, it } from "vitest";
import { planAudioChunks } from "./chunk-audio";

describe("planAudioChunks", () => {
  it("creates a single chunk for short audio", () => {
    expect(planAudioChunks(120, 480)).toEqual([
      { index: 0, startSeconds: 0, endSeconds: 120 },
    ]);
  });

  it("splits long audio into contiguous chunks with offsets", () => {
    expect(planAudioChunks(1_000, 480)).toEqual([
      { index: 0, startSeconds: 0, endSeconds: 480 },
      { index: 1, startSeconds: 480, endSeconds: 960 },
      { index: 2, startSeconds: 960, endSeconds: 1_000 },
    ]);
  });

  it("rejects invalid durations", () => {
    expect(() => planAudioChunks(0)).toThrowError(
      expect.objectContaining({ code: "AUDIO_EXTRACTION_FAILED" }),
    );
  });
});
