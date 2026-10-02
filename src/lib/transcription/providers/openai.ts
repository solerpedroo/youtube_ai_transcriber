import type { TranscriptionProvider } from "../types";
import { transcribeWithOpenAiCompatibleApi } from "./http";

const OPENAI_TRANSCRIPTIONS_URL = "https://api.openai.com/v1/audio/transcriptions";

export const openAiTranscriptionProvider: TranscriptionProvider = {
  id: "openai",
  transcribe(filePath, options) {
    return transcribeWithOpenAiCompatibleApi(OPENAI_TRANSCRIPTIONS_URL, filePath, options);
  },
};
