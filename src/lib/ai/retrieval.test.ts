import { describe, expect, it } from "vitest";
import { extractKeywords, retrieveTranscriptChunks } from "./retrieval";

const chunks = [
  { id: "1", start: 0, end: 10, text: "Introduction to neural networks and deep learning" },
  { id: "2", start: 10, end: 20, text: "Cooking pasta with tomato sauce" },
  { id: "3", start: 20, end: 30, text: "Supervised learning trains neural networks with labels" },
];

describe("extractKeywords", () => {
  it("drops stop words and short tokens", () => {
    expect(extractKeywords("What is the neural network?")).toEqual(["what", "neural", "network"]);
  });
});

describe("retrieveTranscriptChunks", () => {
  it("returns top overlapping chunks ordered by time", () => {
    const retrieved = retrieveTranscriptChunks(chunks, "Explain neural networks learning", 2);
    expect(retrieved.map((chunk) => chunk.id)).toEqual(["1", "3"]);
    expect(retrieved[0]!.score).toBeGreaterThan(0);
  });

  it("falls back to leading chunks when query has no keywords", () => {
    expect(retrieveTranscriptChunks(chunks, "a o e", 2).map((chunk) => chunk.id)).toEqual(["1", "2"]);
  });
});
