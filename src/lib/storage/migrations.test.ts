import { describe, expect, it } from "vitest";
import { TranscriptCitationSchema, TranscriptSegmentSchema } from "../../types";
import { CURRENT_STORAGE_VERSION, createDefaultAppState, migrateAppState } from "./migrations";

describe("local state migration", () => {
  it("returns a clean state when persisted content is not an object", () => {
    expect(migrateAppState("not-json")).toEqual(createDefaultAppState());
  });

  it("drops malformed projects while preserving valid settings", () => {
    const state = migrateAppState({
      version: 0,
      projects: [{ id: "invalid" }, { id: "also-invalid" }],
      settings: {
        chatProvider: { provider: "groq", apiKey: "local-key", model: "llama-3.3-70b-versatile" },
        transcriptionProvider: { provider: "openai", apiKey: "local-key", model: "gpt-4o-transcribe" },
        theme: "dark",
      },
    });

    expect(state.version).toBe(CURRENT_STORAGE_VERSION);
    expect(state.projects).toEqual([]);
    expect(state.settings.theme).toBe("dark");
  });
});

describe("transcript time validation", () => {
  it("rejects segments and citations that end before they start", () => {
    expect(TranscriptSegmentSchema.safeParse({ id: "segment-1", start: 20, end: 10, text: "Invalid" }).success).toBe(false);
    expect(TranscriptCitationSchema.safeParse({ start: 20, end: 10 }).success).toBe(false);
  });
});
