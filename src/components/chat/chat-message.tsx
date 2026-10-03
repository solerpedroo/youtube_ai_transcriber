"use client";

import type { ChatMessage } from "@/types";
import { ChatMarkdown } from "@/components/chat/chat-markdown";
import { StreamingCursor } from "@/components/chat/streaming-cursor";

type ChatMessageBubbleProps = {
  message: ChatMessage;
  onSeek?: (seconds: number) => void;
  isStreaming?: boolean;
};

export function ChatMessageBubble({ message, onSeek, isStreaming = false }: ChatMessageBubbleProps) {
  const isUser = message.role === "user";
  const assistantContent = message.content ?? "";
  const isWaitingForFirstToken = !isUser && isStreaming && assistantContent.length === 0;

  return (
    <div className={`chat-message-enter flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[92%] rounded-2xl px-3 py-2 text-sm leading-6 ${
          isUser
            ? "whitespace-pre-wrap bg-violet-600 text-white"
            : `break-words bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100 ${isStreaming ? "chat-streaming" : ""}`
        }`}
      >
        {isUser ? (
          message.content
        ) : isWaitingForFirstToken ? (
          <StreamingCursor />
        ) : (
          <ChatMarkdown
            content={assistantContent}
            onSeek={onSeek}
            isStreaming={isStreaming}
          />
        )}
      </div>
    </div>
  );
}
