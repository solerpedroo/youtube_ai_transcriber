import type { AIProviderId } from "@/types";

export type AIChatRole = "system" | "user" | "assistant";

export type AIChatMessage = {
  role: AIChatRole;
  content: string;
};

export type AIChatOptions = {
  apiKey: string;
  model: string;
  baseUrl?: string;
  signal?: AbortSignal;
};

export type AIChatStreamEvent =
  | { type: "delta"; text: string }
  | { type: "done" };

export type AIProvider = {
  id: AIProviderId;
  streamChat(
    messages: readonly AIChatMessage[],
    options: AIChatOptions,
  ): AsyncGenerator<AIChatStreamEvent, void, unknown>;
};

export const MAX_TRANSCRIPT_CONTEXT_CHARS = 80_000;
