"use client";

import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import type { VideoMetadata } from "@/types";
import { formatTimestamp } from "@/lib/utils/time";

type VideoHeaderProps = {
  metadata: VideoMetadata;
  statusLabel: string;
};

export function VideoHeader({ metadata, statusLabel }: VideoHeaderProps) {
  return (
    <header className="mb-6 border-b border-border/70 pb-6">
      <Link
        href="/library"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />Biblioteca
      </Link>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <div className="mt-1 hidden h-9 w-1 shrink-0 rounded-full bg-brand sm:block" aria-hidden />
          <div className="min-w-0">
            <p className="label-caps">Espaço de trabalho</p>
            <h1 className="text-display mt-1 truncate text-2xl font-semibold sm:text-3xl">{metadata.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {metadata.channel ?? "Canal não informado"} · {formatTimestamp(metadata.duration)}
            </p>
            <a
              href={metadata.url}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs text-brand hover:underline"
            >
              Abrir no YouTube <ExternalLink className="size-3" />
            </a>
          </div>
        </div>
        <span className="rounded-full border border-brand/20 bg-brand/10 px-3 py-1 text-xs font-medium text-brand">
          {statusLabel}
        </span>
      </div>
    </header>
  );
}
