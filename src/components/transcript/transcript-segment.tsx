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
      <mark className="rounded bg-brand/20 px-0.5 text-inherit">
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
      aria-label={`Ir para ${formatTimestamp(segment.start)}`}
      aria-current={active ? "true" : undefined}
      className={`grid w-full grid-cols-[4.5rem_minmax(0,1fr)] gap-3 rounded-lg px-2 py-2 text-left text-sm transition focus-visible:ring-2 focus-visible:ring-brand/30 focus-visible:outline-none ${
        active
          ? "bg-brand/10 text-foreground ring-1 ring-brand/20"
          : "hover:bg-muted/60"
      }`}
    >
      <span className={`font-mono text-xs tabular-nums ${active ? "text-brand" : "text-muted-foreground"}`}>
        {formatTimestamp(segment.start)}
      </span>
      <span className="leading-6 text-foreground/90">
        {highlightText(segment.text, query)}
      </span>
    </button>
  );
}
