"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MessageSquareText, Subtitles } from "lucide-react";
import type { ChatMessage, Conversation, VideoProject } from "@/types";
import { extractCitations } from "@/lib/ai/citations";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatMessageBubble } from "@/components/chat/chat-message";
import { SuggestedActions } from "@/components/chat/suggested-actions";
import { useProjectStore } from "@/stores/project-store";
import { useSettingsStore } from "@/stores/settings-store";

type ChatPanelProps = {
  project: VideoProject;
  onSeek?: (seconds: number) => void;
};

type StreamEvent =
  | { type: "delta"; text: string }
  | { type: "done" }
  | { type: "error"; code: string; message: string };

function createMessage(role: ChatMessage["role"], content: string): ChatMessage {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    createdAt: new Date().toISOString(),
  };
}

export function ChatPanel({ project, onSeek }: ChatPanelProps) {
  const saveConversation = useProjectStore((state) => state.saveConversation);
  const chatProvider = useSettingsStore((state) => state.settings.chatProvider);
  const hasHydratedSettings = useSettingsStore((state) => state.hasHydrated);

  const existing = project.conversations[0];
  const [conversationId] = useState(() => existing?.id ?? crypto.randomUUID());
  const [messages, setMessages] = useState<ChatMessage[]>(() => existing?.messages ?? []);
  const [error, setError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const createdAtRef = useRef(existing?.createdAt ?? new Date().toISOString());

  const canChat = Boolean(project.transcript && chatProvider.apiKey.trim());

  useEffect(() => () => {
    abortRef.current?.abort();
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: isStreaming ? "auto" : "smooth",
    });
  }, [messages, isStreaming]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && abortRef.current) {
        abortRef.current.abort();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function persist(nextMessages: ChatMessage[]) {
    const now = new Date().toISOString();
    const firstUser = nextMessages.find((message) => message.role === "user");
    const conversation: Conversation = {
      id: conversationId,
      title: firstUser?.content.slice(0, 80) || "Conversa sobre o vídeo",
      messages: nextMessages,
      createdAt: createdAtRef.current,
      updatedAt: now,
    };
    saveConversation(project.id, conversation);
  }

  async function sendPrompt(content: string) {
    if (!canChat || isStreaming) return;
    if (!chatProvider.apiKey.trim()) {
      setError("Configure a chave de API do chat em Configurações.");
      return;
    }
    if (!project.transcript) {
      setError("Gere ou importe uma transcrição antes de usar o chat.");
      return;
    }

    const userMessage = createMessage("user", content);
    const assistantMessage = createMessage("assistant", "");
    const history = [...messages, userMessage];
    const nextMessages = [...history, assistantMessage];
    setMessages(nextMessages);
    setError(null);
    setIsStreaming(true);

    abortRef.current?.abort();
    const abortController = new AbortController();
    abortRef.current = abortController;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortController.signal,
        body: JSON.stringify({
          provider: chatProvider.provider,
          apiKey: chatProvider.apiKey,
          model: chatProvider.model,
          baseUrl: chatProvider.baseUrl,
          videoTitle: project.metadata.title,
          ...(project.transcript.segments.length > 0
            ? {
                transcriptSegments: project.transcript.segments.map((segment) => ({
                  id: segment.id,
                  start: segment.start,
                  end: segment.end,
                  text: segment.text,
                })),
              }
            : { transcriptText: project.transcript.fullText }),
          messages: history.map((message) => ({ role: message.role, content: message.content })),
        }),
      });

      if (!response.ok) {
        const body = await response.json() as { message?: string };
        throw new Error(body.message ?? "Não foi possível iniciar o chat.");
      }
      if (!response.body) throw new Error("Resposta de chat sem corpo.");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line) as StreamEvent;
          if (event.type === "delta") {
            assistantText += event.text;
            setMessages((current) => current.map((message) =>
              message.id === assistantMessage.id ? { ...message, content: assistantText } : message,
            ));
          }
          if (event.type === "error") throw new Error(event.message);
        }
      }

      const finalContent = assistantText || "Não foi possível gerar uma resposta.";
      const citations = extractCitations(finalContent);
      const finalized = nextMessages.map((message) =>
        message.id === assistantMessage.id
          ? { ...message, content: finalContent, citations: citations.length > 0 ? citations : undefined }
          : message,
      );
      setMessages(finalized);
      persist(finalized);
    } catch (requestError) {
      if (abortController.signal.aborted) {
        const stopped = nextMessages.map((message) => {
          if (message.id !== assistantMessage.id) return message;
          const content = message.content || "Resposta interrompida.";
          const citations = extractCitations(content);
          return {
            ...message,
            content,
            citations: citations.length > 0 ? citations : undefined,
          };
        });
        setMessages(stopped);
        persist(stopped);
        return;
      }
      setError(requestError instanceof Error ? requestError.message : "Não foi possível concluir o chat.");
      setMessages(history);
    } finally {
      if (abortRef.current === abortController) abortRef.current = null;
      setIsStreaming(false);
    }
  }

  if (!hasHydratedSettings) {
    return <p className="text-sm text-muted-foreground">Carregando preferências do chat...</p>;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center gap-2">
        <MessageSquareText className="size-4 text-foreground/80" />
        <h2 className="font-semibold">Assistente de IA</h2>
      </div>

      {!project.transcript ? (
        <div className="mt-5 flex flex-1 flex-col items-center justify-center text-center">
          <span className="icon-tile grid size-10 place-items-center rounded-xl">
            <Subtitles className="size-5" />
          </span>
          <p className="mt-4 text-sm font-medium">Transcrição necessária</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Importe legendas ou gere uma transcrição por IA para liberar o chat.
          </p>
        </div>
      ) : !chatProvider.apiKey.trim() ? (
        <div className="mt-5 flex flex-1 flex-col items-center justify-center text-center">
          <p className="text-sm font-medium">Configure um provedor de chat</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Informe a chave de API em <Link href="/settings" className="text-brand underline">Configurações</Link>.
          </p>
        </div>
      ) : (
        <>
          <div ref={listRef} className="mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain pr-1">
            {messages.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                Pergunte qualquer coisa sobre o vídeo ou use um atalho abaixo.
              </div>
            ) : (
              messages.map((message, index) => (
                <ChatMessageBubble
                  key={message.id}
                  message={message}
                  onSeek={onSeek}
                  isStreaming={
                    isStreaming
                    && message.role === "assistant"
                    && index === messages.length - 1
                  }
                />
              ))
            )}
          </div>

          {error && (
            <p className="mt-3 shrink-0 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-950 dark:bg-red-950/30 dark:text-red-300" role="alert">
              {error}
            </p>
          )}

          <div className="mt-3 shrink-0 space-y-3">
            <SuggestedActions disabled={isStreaming} onSelect={(prompt) => void sendPrompt(prompt)} />
            <ChatInput
              disabled={!canChat}
              isStreaming={isStreaming}
              onSend={(content) => void sendPrompt(content)}
              onStop={() => abortRef.current?.abort()}
            />
          </div>
        </>
      )}
    </div>
  );
}
