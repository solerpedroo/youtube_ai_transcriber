import { AppError } from "@/lib/utils/errors";
import type { AIProviderId } from "@/types";
import type { AIProvider } from "./types";
import { anthropicChatProvider } from "./providers/anthropic";
import { geminiChatProvider } from "./providers/gemini";
import { groqChatProvider } from "./providers/groq";
import { openAiChatProvider } from "./providers/openai";
import { openAiCompatibleChatProvider } from "./providers/openai-compatible-provider";

const PROVIDERS: Record<AIProviderId, AIProvider> = {
  openai: openAiChatProvider,
  anthropic: anthropicChatProvider,
  gemini: geminiChatProvider,
  groq: groqChatProvider,
  "openai-compatible": openAiCompatibleChatProvider,
};

export function getAIProvider(provider: AIProviderId): AIProvider {
  const selected = PROVIDERS[provider];
  if (!selected) {
    throw new AppError("INVALID_PROVIDER", "Informe um provedor de chat suportado.");
  }
  return selected;
}
