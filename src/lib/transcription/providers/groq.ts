import type { TranscriptionProvider } from "../types";
import { transcribeWithOpenAiCompatibleApi } from "./http";

const GROQ_TRANSCRIPTIONS_URL = "https://api.groq.com/openai/v1/audio/transcriptions";

export const groqTranscriptionProvider: TranscriptionProvider = {
  id: "groq",
  transcribe(filePath, options, signal) {
    return transcribeWithOpenAiCompatibleApi(GROQ_TRANSCRIPTIONS_URL, filePath, options, signal);
  },
};