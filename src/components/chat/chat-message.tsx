"use client";

import type { ChatMessage } from "@/types";
import { splitContentWithCitations } from "@/lib/ai/citations";

type ChatMessageBubbleProps = {
  message: ChatMessage;
  onSeek?: (seconds: number) => void;
};

export function ChatMessageBubble({ message, onSeek }: ChatMessageBubbleProps) {
  const isUser = message.role === "user";
  const parts = isUser ? null : splitContentWithCitations(message.content || "…");

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[92%] rounded-2xl px-3 py-2 text-sm leading-6 whitespace-pre-wrap ${
          isUser
            ? "bg-violet-600 text-white"
            : "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100"
        }`}
      >
        {isUser || !parts ? (
          message.content || (isUser ? "" : "…")
        ) : (
          parts.map((part, index) => {
            if (part.type === "text") {
              return <span key={`text-${index}`}>{part.value}</span>;
            }
            if (!onSeek) {
              return <span key={`cite-${index}`}>[{part.label}]</span>;
            }
            return (
              <button
                key={`cite-${index}`}
                type="button"
                onClick={() => onSeek(part.seconds)}
                className="mx-0.5 inline rounded bg-violet-200 px-1 font-medium text-violet-900 hover:bg-violet-300 dark:bg-violet-900/60 dark:text-violet-100 dark:hover:bg-violet-800"
                title={`Ir para ${part.label}`}
                aria-label={`Ir para ${part.label}`}
              >
                [{part.label}]
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
