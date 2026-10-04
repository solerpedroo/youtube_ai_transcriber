"use client";

import type { ChatMessage } from "@/types";
import { ChatMarkdown } from "@/components/chat/chat-markdown";
import { CopyMessageButton } from "@/components/chat/copy-message-button";
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

  const showCopy = !isUser && !isWaitingForFirstToken && assistantContent.length > 0;

  return (
    <div className={`chat-message-enter flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[92%] ${isUser ? "" : "space-y-1"}`}>
        <div
          className={`rounded-2xl px-3 py-2 text-sm leading-6 ${
            isUser
              ? "whitespace-pre-wrap bg-brand text-brand-foreground"
              : `break-words bg-muted/70 text-foreground ${isStreaming ? "chat-streaming" : ""}`
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
        {showCopy && (
          <CopyMessageButton text={assistantContent} disabled={isStreaming && assistantContent.length === 0} />
        )}
      </div>
    </div>
  );
}
