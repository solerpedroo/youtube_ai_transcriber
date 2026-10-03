import { AppError, isAppError } from "@/lib/utils/errors";
import { secureProviderHttpsFetch } from "@/lib/security/secure-fetch";
import { validateOutboundHttpsBaseUrl } from "@/lib/security/outbound-url";
import { assertChatCredentials, iterateSseDataLines, mapProviderHttpError } from "../http";
import type { AIChatMessage, AIChatOptions, AIChatStreamEvent, AIProvider } from "../types";
function toOpenAiMessages(messages: readonly AIChatMessage[]) {
  return messages.map((message) => ({
    role: message.role,
    content: message.content,
  }));
}

export async function* streamOpenAiCompatibleChat(
  endpoint: string,
  messages: readonly AIChatMessage[],
  options: AIChatOptions,
): AsyncGenerator<AIChatStreamEvent, void, unknown> {
  assertChatCredentials(options.apiKey, options.model);
  if (options.signal?.aborted) {
    throw new AppError("CHAT_FAILED", "O chat foi cancelado.");
  }

  const useSecureFetch = !endpoint.startsWith("https://api.openai.com/")
    && !endpoint.startsWith("https://api.groq.com/");

  let response: Response;
  try {
    const init: RequestInit = {
      method: "POST",
      headers: {
        Authorization: `Bearer ${options.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: options.model,
        messages: toOpenAiMessages(messages),
        stream: true,
      }),
      signal: options.signal,
    };
    response = useSecureFetch
      ? await secureProviderHttpsFetch(endpoint, init)
      : await fetch(endpoint, init);
  } catch (error) {
    if (isAppError(error)) throw error;
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
    const delta = (payload as { choices?: Array<{ delta?: { content?: string | null } }> })
      .choices?.[0]?.delta?.content;
    if (typeof delta === "string" && delta.length > 0) {
      yield { type: "delta", text: delta };
    }
  }
  yield { type: "done" };
}

export function createOpenAiCompatibleProvider(
  id: AIProvider["id"],
  defaultEndpoint: string,
): AIProvider {
  return {
    id,
    streamChat(messages, options) {
      const endpoint = options.baseUrl
        ? `${validateOutboundHttpsBaseUrl(options.baseUrl)}/chat/completions`
        : defaultEndpoint;
      return streamOpenAiCompatibleChat(endpoint, messages, options);
    },
  };
}
