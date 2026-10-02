"use client";

import type { ChatMessage } from "@/types";

type ChatMessageBubbleProps = {
  message: ChatMessage;
};

export function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[92%] rounded-2xl px-3 py-2 text-sm leading-6 whitespace-pre-wrap ${
          isUser
            ? "bg-violet-600 text-white"
            : "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100"
        }`}
      >
        {message.content || (isUser ? "" : "…")}
      </div>
    </div>
  );
}
