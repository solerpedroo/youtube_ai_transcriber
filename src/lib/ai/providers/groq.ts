import { createOpenAiCompatibleProvider } from "./openai-compatible";

export const groqChatProvider = createOpenAiCompatibleProvider(
  "groq",
  "https://api.groq.com/openai/v1/chat/completions",
);
