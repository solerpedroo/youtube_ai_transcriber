"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "cn";

type CopyMessageButtonProps = {
  text: string;
  className?: string;
  disabled?: boolean;
};

export function CopyMessageButton({ text, className, disabled }: CopyMessageButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (disabled || !text.trim()) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="xs"
      disabled={disabled || !text.trim()}
      className={cn("h-7 gap-1.5 text-muted-foreground hover:text-foreground", className)}
      aria-label={copied ? "Texto copiado" : "Copiar resposta"}
      onClick={() => void handleCopy()}
    >
      {copied ? <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="size-3.5" />}
      {copied ? "Copiado" : "Copiar"}
    </Button>
  );
}
