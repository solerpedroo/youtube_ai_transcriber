import { AppError } from "@/lib/utils/errors";

export function mapProviderHttpError(status: number, bodyText: string): AppError {
  if (status === 401 || status === 403) {
    return new AppError("PROVIDER_AUTH_FAILED", "A chave de API do provedor de chat foi rejeitada.");
  }
  if (status === 429) {
    return new AppError("RATE_LIMITED", "O provedor de chat atingiu o limite de requisições.");
  }
  if (status === 413 || bodyText.toLowerCase().includes("context_length") || bodyText.toLowerCase().includes("too large")) {
    return new AppError("CONTEXT_TOO_LARGE", "O contexto enviado excede o limite do modelo.");
  }
  return new AppError(
    "CHAT_FAILED",
    "Não foi possível obter resposta do provedor de chat.",
    bodyText.slice(0, 500),
  );
}

/** Parses SSE `data:` lines from a provider stream. */
export async function* iterateSseDataLines(
  body: ReadableStream<Uint8Array>,
  signal?: AbortSignal,
): AsyncGenerator<string, void, unknown> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      if (signal?.aborted) {
        throw new AppError("CHAT_FAILED", "O chat foi cancelado.");
      }
      const { done, value } = await reader.read();
      if (done) {
        buffer += decoder.decode();
        break;
      }
      buffer += decoder.decode(value, { stream: true });
      const chunks = buffer.split("\n");
      buffer = chunks.pop() ?? "";
      for (const rawLine of chunks) {
        const line = rawLine.trimEnd();
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trimStart();
        if (!data || data === "[DONE]") {
          if (data === "[DONE]") return;
          continue;
        }
        yield data;
      }
    }

    const trailing = buffer.trimEnd();
    if (trailing.startsWith("data:")) {
      const data = trailing.slice(5).trimStart();
      if (data && data !== "[DONE]") yield data;
    }
  } finally {
    reader.releaseLock();
  }
}

export function assertChatCredentials(apiKey: string, model: string): void {
  if (!apiKey.trim()) {
    throw new AppError("PROVIDER_AUTH_FAILED", "Informe a chave de API do provedor de chat.");
  }
  if (!model.trim()) {
    throw new AppError("INVALID_PROVIDER", "Informe o modelo de chat.");
  }
}
