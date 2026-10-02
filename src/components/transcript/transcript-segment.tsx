"use client";

import type { TranscriptSegment } from "@/types";
import { formatTimestamp } from "@/lib/utils/time";

type TranscriptSegmentRowProps = {
  segment: TranscriptSegment;
  active?: boolean;
  query?: string;
  onSeek: (seconds: number) => void;
};

function highlightText(text: string, query: string) {
  const normalized = query.trim();
  if (!normalized) return text;
  const lowerText = text.toLocaleLowerCase();
  const lowerQuery = normalized.toLocaleLowerCase();
  const index = lowerText.indexOf(lowerQuery);
  if (index === -1) return text;
  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded bg-amber-200 px-0.5 text-inherit dark:bg-amber-500/40">
        {text.slice(index, index + normalized.length)}
      </mark>
      {text.slice(index + normalized.length)}
    </>
  );
}

export function TranscriptSegmentRow({
  segment,
  active = false,
  query = "",
  onSeek,
}: TranscriptSegmentRowProps) {
  return (
    <button
      type="button"
      data-segment-id={segment.id}
      onClick={() => onSeek(segment.start)}
      className={`grid w-full grid-cols-[4.5rem_minmax(0,1fr)] gap-3 rounded-lg px-2 py-2 text-left text-sm transition ${
        active
          ? "bg-violet-100 text-violet-950 dark:bg-violet-950/50 dark:text-violet-100"
          : "hover:bg-zinc-100 dark:hover:bg-zinc-800/80"
      }`}
    >
      <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
        {formatTimestamp(segment.start)}
      </span>
      <span className="leading-6 text-zinc-700 dark:text-zinc-300">
        {highlightText(segment.text, query)}
      </span>
    </button>
  );
}
