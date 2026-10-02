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
    <div className="mb-6">
      <Link href="/library" className="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white">
        <ArrowLeft className="size-4" />Biblioteca
      </Link>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Espaço de trabalho</p>
          <h1 className="mt-1 truncate text-2xl font-semibold tracking-tight">{metadata.title}</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {metadata.channel ?? "Canal não informado"} · {formatTimestamp(metadata.duration)}
          </p>
          <a
            href={metadata.url}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-xs text-violet-700 hover:underline dark:text-violet-300"
          >
            Abrir no YouTube <ExternalLink className="size-3" />
          </a>
        </div>
        <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-medium text-violet-800 dark:bg-violet-950/50 dark:text-violet-300">
          {statusLabel}
        </span>
      </div>
    </div>
  );
}
