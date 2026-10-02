import { AppError } from "@/lib/utils/errors";
import type { AIChatMessage } from "./types";
import { MAX_TRANSCRIPT_CONTEXT_CHARS } from "./types";

export type BuildChatContextInput = {
  videoTitle: string;
  transcriptText?: string;
  messages: ReadonlyArray<{ role: "user" | "assistant"; content: string }>;
};

/** Builds provider messages with a basic transcript-aware system prompt (full retrieval arrives in W07). */
export function buildChatMessages(input: BuildChatContextInput): AIChatMessage[] {
  if (input.messages.length === 0) {
    throw new AppError("CHAT_FAILED", "Envie pelo menos uma mensagem.");
  }

  const transcript = (input.transcriptText ?? "").trim();
  if (transcript.length > MAX_TRANSCRIPT_CONTEXT_CHARS) {
    throw new AppError(
      "CONTEXT_TOO_LARGE",
      "A transcrição é grande demais para o chat nesta fase. Use perguntas mais curtas ou aguarde a recuperação por trechos.",
    );
  }

  const systemParts = [
    "You are a helpful study assistant for a YouTube video.",
    `Video title: ${input.videoTitle || "Untitled video"}`,
    "Answer using the transcript when available. If the transcript does not contain the answer, say so clearly.",
    "Prefer concise answers in the same language as the user.",
  ];
  if (transcript) {
    systemParts.push("Transcript:", transcript);
  } else {
    systemParts.push("No transcript was provided for this conversation.");
  }

  return [
    { role: "system", content: systemParts.join("\n\n") },
    ...input.messages.map((message) => ({
      role: message.role,
      content: message.content,
    })),
  ];
}
