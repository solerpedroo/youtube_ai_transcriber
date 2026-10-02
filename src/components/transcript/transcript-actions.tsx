"use client";

import { useState } from "react";
import { Check, Copy, Download } from "lucide-react";
import type { Transcript, VideoMetadata } from "@/types";
import {
  downloadTextFile,
  exportTranscriptJson,
  exportTranscriptMarkdown,
  exportTranscriptSrt,
  exportTranscriptTxt,
  exportTranscriptVtt,
  slugifyFilename,
} from "@/lib/transcript/exports";
import { Button } from "@/components/ui/button";

type TranscriptActionsProps = {
  metadata: VideoMetadata;
  transcript: Transcript;
};

const EXPORTS = [
  { id: "txt", label: "TXT", mime: "text/plain;charset=utf-8" },
  { id: "md", label: "Markdown", mime: "text/markdown;charset=utf-8" },
  { id: "json", label: "JSON", mime: "application/json;charset=utf-8" },
  { id: "srt", label: "SRT", mime: "application/x-subrip;charset=utf-8" },
  { id: "vtt", label: "VTT", mime: "text/vtt;charset=utf-8" },
] as const;

export function TranscriptActions({ metadata, transcript }: TranscriptActionsProps) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const baseName = slugifyFilename(metadata.title);

  async function copyTranscript() {
    setCopyError(null);
    const text = exportTranscriptTxt({ metadata, transcript });
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("A área de transferência não está disponível neste navegador.");
      }
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1_500);
    } catch (error) {
      setCopied(false);
      setCopyError(error instanceof Error ? error.message : "Não foi possível copiar a transcrição.");
    }
  }

  function exportAs(kind: (typeof EXPORTS)[number]["id"]) {
    const content = kind === "txt"
      ? exportTranscriptTxt({ metadata, transcript })
      : kind === "md"
        ? exportTranscriptMarkdown({ metadata, transcript })
        : kind === "json"
          ? exportTranscriptJson({ metadata, transcript })
          : kind === "srt"
            ? exportTranscriptSrt(transcript)
            : exportTranscriptVtt(transcript);
    const extension = kind === "md" ? "md" : kind;
    const mime = EXPORTS.find((item) => item.id === kind)?.mime ?? "text/plain;charset=utf-8";
    downloadTextFile(`${baseName}.${extension}`, content, mime);
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" variant="outline" onClick={() => void copyTranscript()}>
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? "Copiado" : "Copiar"}
        </Button>
        <div className="flex flex-wrap gap-1">
          {EXPORTS.map((item) => (
            <Button
              key={item.id}
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => exportAs(item.id)}
            >
              <Download className="size-3.5" />
              {item.label}
            </Button>
          ))}
        </div>
      </div>
      {copyError && (
        <p className="text-xs text-red-600 dark:text-red-300" role="alert">{copyError}</p>
      )}
    </div>
  );
}
