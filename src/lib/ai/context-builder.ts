import { AppError } from "@/lib/utils/errors";
import type { TranscriptSegment } from "@/types";
import { chunkTranscriptSegments, formatChunkForPrompt } from "./chunk-transcript";
import { retrieveTranscriptChunks } from "./retrieval";
import type { AIChatMessage } from "./types";
import { MAX_TRANSCRIPT_CONTEXT_CHARS } from "./types";

/** Below this size, the full transcript is sent; above it, retrieval is used. */
export const FULL_TRANSCRIPT_CHAR_LIMIT = 24_000;
export const DEFAULT_RETRIEVAL_TOP_K = 8;

export type BuildChatContextInput = {
  videoTitle: string;
  transcriptText?: string;
  transcriptSegments?: readonly TranscriptSegment[];
  messages: ReadonlyArray<{ role: "user" | "assistant"; content: string }>;
};

function buildGroundingSystemPrompt(videoTitle: string, contextBlock: string, mode: "full" | "retrieved"): string {
  return [
    "You are an AI assistant helping the user understand a video.",
    `Video title: ${videoTitle || "Untitled video"}`,
    "Use the provided video transcript as your primary source of truth.",
    "When possible:",
    "- reference timestamps using the exact bracket format [m:ss] or [h:mm:ss];",
    "- explain concepts clearly;",
    "- differentiate information contained in the video from your own general knowledge;",
    "- say when something was not discussed in the video.",
    "Never claim the video said something that is not present in the transcript.",
    mode === "retrieved"
      ? "Only some relevant transcript excerpts were provided because the full transcript is large."
      : "The full transcript was provided below.",
    "Transcript context:",
    contextBlock || "No transcript was provided for this conversation.",
  ].join("\n\n");
}

function latestUserQuestion(messages: BuildChatContextInput["messages"]): string {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index]!;
    if (message.role === "user") return message.content;
  }
  return messages.at(-1)?.content ?? "";
}

function buildContextFromSegments(segments: readonly TranscriptSegment[], question: string): {
  contextBlock: string;
  mode: "full" | "retrieved";
} {
  const formattedFull = segments
    .map((segment) => `[${formatClock(segment.start)}] ${segment.text.trim()}`)
    .filter((line) => line.length > 0)
    .join("\n");

  if (formattedFull.length <= FULL_TRANSCRIPT_CHAR_LIMIT) {
    return { contextBlock: formattedFull, mode: "full" };
  }

  const chunks = chunkTranscriptSegments(segments);
  const retrieved = retrieveTranscriptChunks(chunks, question, DEFAULT_RETRIEVAL_TOP_K);
  const selected = retrieved.length > 0 ? retrieved : chunks.slice(0, DEFAULT_RETRIEVAL_TOP_K);
  const contextBlock = selected.map((chunk) => formatChunkForPrompt(chunk)).join("\n\n");

  if (contextBlock.length > MAX_TRANSCRIPT_CONTEXT_CHARS) {
    throw new AppError(
      "CONTEXT_TOO_LARGE",
      "O contexto recuperado da transcrição ainda excede o limite do chat.",
    );
  }

  return { contextBlock, mode: "retrieved" };
}

function formatClock(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(total / 3_600);
  const minutes = Math.floor((total % 3_600) / 60);
  const remaining = total % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`;
  }
  return `${minutes}:${String(remaining).padStart(2, "0")}`;
}

/** Builds grounded chat messages, using full transcript or retrieved chunks. */
export function buildChatMessages(input: BuildChatContextInput): AIChatMessage[] {
  if (input.messages.length === 0) {
    throw new AppError("CHAT_FAILED", "Envie pelo menos uma mensagem.");
  }

  const question = latestUserQuestion(input.messages);
  let contextBlock = "";
  let mode: "full" | "retrieved" = "full";

  if (input.transcriptSegments && input.transcriptSegments.length > 0) {
    ({ contextBlock, mode } = buildContextFromSegments(input.transcriptSegments, question));
  } else {
    const transcript = (input.transcriptText ?? "").trim();
    if (transcript.length > MAX_TRANSCRIPT_CONTEXT_CHARS) {
      throw new AppError(
        "CONTEXT_TOO_LARGE",
        "A transcrição é grande demais para o chat. Envie os segmentos para recuperação por trechos.",
      );
    }
    contextBlock = transcript;
  }

  return [
    {
      role: "system",
      content: buildGroundingSystemPrompt(input.videoTitle, contextBlock, mode),
    },
    ...input.messages.map((message) => ({
      role: message.role,
      content: message.content,
    })),
  ];
}
