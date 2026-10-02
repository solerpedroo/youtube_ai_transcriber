import { describe, expect, it } from "vitest";
import { buildChatMessages, FULL_TRANSCRIPT_CHAR_LIMIT } from "./context-builder";

describe("buildChatMessages", () => {
  it("includes grounding instructions and timestamps for small transcripts", () => {
    const messages = buildChatMessages({
      videoTitle: "Sample",
      transcriptSegments: [
        { id: "1", start: 12, end: 20, text: "Neural networks basics" },
        { id: "2", start: 40, end: 50, text: "Supervised learning" },
      ],
      messages: [{ role: "user", content: "Resuma" }],
    });

    expect(messages[0]?.role).toBe("system");
    expect(messages[0]?.content).toContain("primary source of truth");
    expect(messages[0]?.content).toContain("[0:12] Neural networks basics");
    expect(messages[0]?.content).toContain("[m:ss]");
    expect(messages[1]).toEqual({ role: "user", content: "Resuma" });
  });

  it("retrieves excerpts for large transcripts instead of failing", () => {
    const segments = Array.from({ length: 400 }, (_, index) => ({
      id: String(index + 1),
      start: index * 10,
      end: index * 10 + 8,
      text: index === 250
        ? "Detailed explanation about quantum entanglement experiments"
        : `Filler segment number ${index} talking about unrelated cooking recipes and travel tips`,
    }));

    const formattedLength = segments
      .map((segment) => `[0:00] ${segment.text}`)
      .join("\n").length;
    expect(formattedLength).toBeGreaterThan(FULL_TRANSCRIPT_CHAR_LIMIT);

    const messages = buildChatMessages({
      videoTitle: "Large video",
      transcriptSegments: segments,
      messages: [{ role: "user", content: "Explain quantum entanglement" }],
    });

    expect(messages[0]?.content).toContain("relevant transcript excerpts");
    expect(messages[0]?.content).toContain("quantum entanglement");
    expect(messages[0]?.content.length).toBeLessThan(FULL_TRANSCRIPT_CHAR_LIMIT);
  });
});
