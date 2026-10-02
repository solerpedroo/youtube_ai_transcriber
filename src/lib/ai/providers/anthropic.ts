import { AppError } from "@/lib/utils/errors";
import { assertChatCredentials, iterateSseDataLines, mapProviderHttpError } from "../http";
import type { AIChatMessage, AIChatStreamEvent, AIProvider } from "../types";

function splitSystem(messages: readonly AIChatMessage[]) {
  const system = messages.filter((message) => message.role === "system").map((message) => message.content).join("\n\n");
  const chatMessages = messages
    .filter((message) => message.role !== "system")
    .map((message) => ({ role: message.role as "user" | "assistant", content: message.content }));
  return { system, chatMessages };
}

export const anthropicChatProvider: AIProvider = {
  id: "anthropic",
  async *streamChat(messages, options): AsyncGenerator<AIChatStreamEvent, void, unknown> {
    assertChatCredentials(options.apiKey, options.model);
    if (options.signal?.aborted) {
      throw new AppError("CHAT_FAILED", "O chat foi cancelado.");
    }

    const { system, chatMessages } = splitSystem(messages);
    if (chatMessages.length === 0) {
      throw new AppError("CHAT_FAILED", "Envie pelo menos uma mensagem de usuário.");
    }

    let response: Response;
    try {
      response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": options.apiKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: options.model,
          max_tokens: 2_048,
          system: system || undefined,
          messages: chatMessages,
          stream: true,
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
      const event = payload as { type?: string; delta?: { type?: string; text?: string } };
      if (event.type === "content_block_delta" && event.delta?.type === "text_delta" && event.delta.text) {
        yield { type: "delta", text: event.delta.text };
      }
    }
    yield { type: "done" };
  },
};
