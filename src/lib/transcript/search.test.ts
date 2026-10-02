import { describe, expect, it } from "vitest";
import { findActiveSegmentIndex, searchTranscriptSegments } from "./search";

const segments = [
  { id: "1", start: 0, end: 2, text: "Hello world" },
  { id: "2", start: 2, end: 5, text: "Neural networks" },
  { id: "3", start: 5, end: 8, text: "More about World models" },
];

describe("searchTranscriptSegments", () => {
  it("returns all segments for an empty query", () => {
    expect(searchTranscriptSegments(segments, "  ")).toHaveLength(3);
  });

  it("filters by case-insensitive substring", () => {
    expect(searchTranscriptSegments(segments, "world").map((hit) => hit.segment.id)).toEqual(["1", "3"]);
  });
});

describe("findActiveSegmentIndex", () => {
  it("finds the segment covering the current playback time", () => {
    expect(findActiveSegmentIndex(segments, 2.5)).toBe(1);
    expect(findActiveSegmentIndex(segments, 0)).toBe(0);
    expect(findActiveSegmentIndex(segments, 10)).toBe(2);
  });
});
