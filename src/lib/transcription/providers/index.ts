import { AppError } from "@/lib/utils/errors";
import type { TranscriptionProviderId } from "@/types";
import type { TranscriptionProvider } from "../types";
import { groqTranscriptionProvider } from "./groq";
import { openAiTranscriptionProvider } from "./openai";

const PROVIDERS: Record<TranscriptionProviderId, TranscriptionProvider> = {
  openai: openAiTranscriptionProvider,
  groq: groqTranscriptionProvider,
};

export function getTranscriptionProvider(provider: TranscriptionProviderId): TranscriptionProvider {
  const selected = PROVIDERS[provider];
  if (!selected) {
    throw new AppError("INVALID_PROVIDER", "Informe um provedor de transcrição suportado.");
  }
  return selected;
}
