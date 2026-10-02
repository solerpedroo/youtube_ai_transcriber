import { describe, expect, it, vi } from "vitest";
import { streamOpenAiCompatibleChat } from "./providers/openai-compatible";

function sseResponse(lines: string[], status = 200): Response {
  return new Response(lines.join("\n"), {
    status,
    headers: { "Content-Type": "text/event-stream" },
  });
}

describe("streamOpenAiCompatibleChat", () => {
  it("yields text deltas from OpenAI-compatible SSE", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      sseResponse([
        'data: {"choices":[{"delta":{"content":"Olá"}}]}',
        "",
        'data: {"choices":[{"delta":{"content":" mundo"}}]}',
        "",
        "data: [DONE]",
        "",
      ]),
    );

    const events = [];
    for await (const event of streamOpenAiCompatibleChat(
      "https://api.openai.com/v1/chat/completions",
      [{ role: "user", content: "Oi" }],
      { apiKey: "sk-test", model: "gpt-4.1-mini" },
    )) {
      events.push(event);
    }

    expect(events).toEqual([
      { type: "delta", text: "Olá" },
      { type: "delta", text: " mundo" },
      { type: "done" },
    ]);
    vi.restoreAllMocks();
  });

  it("maps unauthorized responses", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("nope", { status: 401 }));
    const iterator = streamOpenAiCompatibleChat(
      "https://api.openai.com/v1/chat/completions",
      [{ role: "user", content: "Oi" }],
      { apiKey: "sk-test", model: "gpt-4.1-mini" },
    );
    await expect(iterator.next()).rejects.toMatchObject({ code: "PROVIDER_AUTH_FAILED" });
    vi.restoreAllMocks();
  });
});
