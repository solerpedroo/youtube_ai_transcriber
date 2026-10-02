import { createOpenAiCompatibleProvider } from "./openai-compatible";

export const openAiChatProvider = createOpenAiCompatibleProvider(
  "openai",
  "https://api.openai.com/v1/chat/completions",
);
