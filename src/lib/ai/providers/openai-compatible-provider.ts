import { createOpenAiCompatibleProvider } from "./openai-compatible";

export const openAiCompatibleChatProvider = createOpenAiCompatibleProvider(
  "openai-compatible",
  "https://api.openai.com/v1/chat/completions",
);
