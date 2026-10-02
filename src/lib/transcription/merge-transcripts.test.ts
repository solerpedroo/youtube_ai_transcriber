import { describe, expect, it } from "vitest";
import { mergeTranscriptChunks } from "./merge-transcripts";

describe("mergeTranscriptChunks", () => {
  it("offsets timestamps and preserves ordered segments", () => {
    const merged = mergeTranscriptChunks([
      {
        offsetSeconds: 0,
        result: {
          language: "en",
          segments: [{ id: "a", start: 0, end: 2, text: "Hello" }],
          fullText: "Hello",
        },
      },
      {
        offsetSeconds: 480,
        result: {
          language: "en",
          segments: [{ id: "b", start: 1, end: 3, text: "world" }],
          fullText: "world",
        },
      },
    ]);

    expect(merged).toEqual({
      language: "en",
      segments: [
        { id: "transcript-1-1", start: 0, end: 2, text: "Hello" },
        { id: "transcript-2-1", start: 481, end: 483, text: "world" },
      ],
      fullText: "Hello world",
    });
  });

  it("drops empty segments", () => {
    expect(mergeTranscriptChunks([
      {
        offsetSeconds: 0,
        result: {
          segments: [
            { id: "a", start: 0, end: 1, text: "  " },
            { id: "b", start: 1, end: 2, text: "Keep" },
          ],
          fullText: "Keep",
        },
      },
    ]).segments).toEqual([
      { id: "transcript-1-2", start: 1, end: 2, text: "Keep" },
    ]);
  });
});
