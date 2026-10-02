import { describe, expect, it } from "vitest";
import { buildFullText, normalizeSubtitleSegments } from "./normalize-segments";

describe("normalizeSubtitleSegments", () => {
  it("assigns ids and drops empty text", () => {
    expect(normalizeSubtitleSegments([
      { start: 1, end: 2, text: "  Hello  " },
      { start: 2, end: 3, text: "   " },
      { start: 3, end: 4, text: "world" },
    ])).toEqual([
      { id: "caption-1", start: 1, end: 2, text: "Hello" },
      { id: "caption-2", start: 3, end: 4, text: "world" },
    ]);
  });

  it("merges identical consecutive cues and rolling caption growth", () => {
    expect(normalizeSubtitleSegments([
      { start: 0, end: 2, text: "Hello" },
      { start: 1, end: 3, text: "Hello" },
      { start: 2, end: 4, text: "Hello world" },
      { start: 3, end: 5, text: "world" },
    ])).toEqual([
      { id: "caption-1", start: 0, end: 5, text: "Hello world" },
    ]);
  });

  it("builds searchable full text", () => {
    expect(buildFullText([
      { id: "caption-1", start: 0, end: 1, text: "Hello" },
      { id: "caption-2", start: 1, end: 2, text: "world" },
    ])).toBe("Hello world");
  });
});
