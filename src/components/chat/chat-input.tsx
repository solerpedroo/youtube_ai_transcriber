"use client";

import { useState, type FormEvent, type KeyboardEvent } from "react";
import { LoaderCircle, SendHorizonal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type ChatInputProps = {
  disabled?: boolean;
  isStreaming?: boolean;
  onSend: (content: string) => void;
  onStop?: () => void;
};

export function ChatInput({ disabled, isStreaming, onSend, onStop }: ChatInputProps) {
  const [value, setValue] = useState("");

  function submit() {
    const content = value.trim();
    if (!content || disabled || isStreaming) return;
    onSend(content);
    setValue("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submit();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  }

  return (
    <form className="flex items-end gap-2" onSubmit={handleSubmit}>
      <label className="sr-only" htmlFor="chat-input">Pergunta sobre o vídeo</label>
      <Textarea
        id="chat-input"
        rows={2}
        value={value}
        disabled={disabled}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Faça uma pergunta sobre o vídeo..."
        className="min-h-16 flex-1 rounded-xl"
      />
      {isStreaming ? (
        <Button type="button" variant="outline" onClick={onStop}>
          <LoaderCircle className="size-4 animate-spin" />Parar
        </Button>
      ) : (
        <Button type="submit" variant="brand" className="brand-glow" disabled={disabled || !value.trim()}>
          <SendHorizonal className="size-4" />Enviar
        </Button>
      )}
    </form>
  );
}
