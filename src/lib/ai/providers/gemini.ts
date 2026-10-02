import { AppError } from "@/lib/utils/errors";
import { assertChatCredentials, iterateSseDataLines, mapProviderHttpError } from "../http";
import type { AIChatMessage, AIChatStreamEvent, AIProvider } from "../types";

function toGeminiContents(messages: readonly AIChatMessage[]) {
  const system = messages.filter((message) => message.role === "system").map((message) => message.content).join("\n\n");
  const contents = messages
    .filter((message) => message.role !== "system")
    .map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content }],
    }));
  return { system, contents };
}

export const geminiChatProvider: AIProvider = {
  id: "gemini",
  async *streamChat(messages, options): AsyncGenerator<AIChatStreamEvent, void, unknown> {
    assertChatCredentials(options.apiKey, options.model);
    if (options.signal?.aborted) {
      throw new AppError("CHAT_FAILED", "O chat foi cancelado.");
    }

    const { system, contents } = toGeminiContents(messages);
    if (contents.length === 0) {
      throw new AppError("CHAT_FAILED", "Envie pelo menos uma mensagem de usuário.");
    }

    const model = encodeURIComponent(options.model);
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`;

    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": options.apiKey,
        },
        body: JSON.stringify({
          systemInstruction: system ? { parts: [{ text: system }] } : undefined,
          contents,
        }),
        signal: options.signal,
      });
    } catch (error) {
      if (options.signal?.aborted || (error instanceof Error && error.name === "AbortError")) {
        throw new AppError("CHAT_FAILED", "O chat foi cancelado.");
      }
      throw new AppError("CHAT_FAILED", "Não foi possível contatar o provedor de chat.");
    }

    if (!response.ok) {
      throw mapProviderHttpError(response.status, await response.text());
    }
    if (!response.body) {
      throw new AppError("CHAT_FAILED", "Resposta de chat sem corpo.");
    }

    for await (const data of iterateSseDataLines(response.body, options.signal)) {
      let payload: unknown;
      try {
        payload = JSON.parse(data);
      } catch {
        continue;
      }
      const parts = (payload as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      }).candidates?.[0]?.content?.parts ?? [];
      for (const part of parts) {
        if (typeof part.text === "string" && part.text.length > 0) {
          yield { type: "delta", text: part.text };
        }
      }
    }
    yield { type: "done" };
  },
};
