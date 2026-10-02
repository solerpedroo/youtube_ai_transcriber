import { describe, expect, it } from "vitest";
import { chunkTranscriptSegments, formatChunkForPrompt } from "./chunk-transcript";

describe("chunkTranscriptSegments", () => {
  it("returns empty for empty input", () => {
    expect(chunkTranscriptSegments([])).toEqual([]);
  });

  it("keeps a short transcript as one chunk", () => {
    const chunks = chunkTranscriptSegments([
      { id: "1", start: 0, end: 2, text: "Hello" },
      { id: "2", start: 2, end: 4, text: "world" },
    ], 100);
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toMatchObject({ start: 0, end: 4, text: "Hello world" });
  });

  it("splits long transcripts and preserves time bounds", () => {
    const segments = Array.from({ length: 20 }, (_, index) => ({
      id: String(index + 1),
      start: index * 5,
      end: index * 5 + 4,
      text: `Segment number ${index + 1} with enough words`,
    }));
    const chunks = chunkTranscriptSegments(segments, 80, 20);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0]!.start).toBe(0);
    expect(chunks.at(-1)!.end).toBe(segments.at(-1)!.end);
    expect(formatChunkForPrompt(chunks[0]!)).toContain("[0:00 -");
  });
});
