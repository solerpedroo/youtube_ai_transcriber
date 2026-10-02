import { describe, expect, it } from "vitest";
import { buildChatMessages } from "./context-builder";
import { MAX_TRANSCRIPT_CONTEXT_CHARS } from "./types";

describe("buildChatMessages", () => {
  it("prepends a system prompt and keeps chat turns", () => {
    const messages = buildChatMessages({
      videoTitle: "Sample",
      transcriptText: "Hello from the transcript",
      messages: [{ role: "user", content: "Resuma" }],
    });
    expect(messages[0]?.role).toBe("system");
    expect(messages[0]?.content).toContain("Sample");
    expect(messages[0]?.content).toContain("Hello from the transcript");
    expect(messages[1]).toEqual({ role: "user", content: "Resuma" });
  });

  it("rejects oversized transcripts", () => {
    expect(() => buildChatMessages({
      videoTitle: "Sample",
      transcriptText: "x".repeat(MAX_TRANSCRIPT_CONTEXT_CHARS + 1),
      messages: [{ role: "user", content: "Oi" }],
    })).toThrowError(expect.objectContaining({ code: "CONTEXT_TOO_LARGE" }));
  });
});
