"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Transcript, VideoMetadata } from "@/types";
import { findActiveSegmentIndex, searchTranscriptSegments } from "@/lib/transcript/search";
import { TranscriptActions } from "@/components/transcript/transcript-actions";
import { TranscriptSearch } from "@/components/transcript/transcript-search";
import { TranscriptSegmentRow } from "@/components/transcript/transcript-segment";

type TranscriptViewProps = {
  metadata: VideoMetadata;
  transcript: Transcript;
  currentTime?: number;
  onSeek: (seconds: number) => void;
};

export function TranscriptView({
  metadata,
  transcript,
  currentTime = 0,
  onSeek,
}: TranscriptViewProps) {
  const [query, setQuery] = useState("");
  const listRef = useRef<HTMLDivElement | null>(null);
  const hits = useMemo(
    () => searchTranscriptSegments(transcript.segments, query),
    [query, transcript.segments],
  );
  const activeIndex = useMemo(
    () => findActiveSegmentIndex(transcript.segments, currentTime),
    [currentTime, transcript.segments],
  );
  const activeSegmentId = activeIndex >= 0 ? transcript.segments[activeIndex]?.id : undefined;

  useEffect(() => {
    if (!activeSegmentId || query.trim()) return;
    const node = listRef.current?.querySelector(`[data-segment-id="${activeSegmentId}"]`);
    node?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [activeSegmentId, query]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <TranscriptSearch value={query} onChange={setQuery} resultCount={hits.length} />
        <TranscriptActions metadata={metadata} transcript={transcript} />
      </div>

      <div ref={listRef} className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
        {hits.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-300 p-5 text-sm text-zinc-500 dark:border-zinc-700">
            Nenhum segmento corresponde à busca.
          </p>
        ) : (
          hits.map(({ segment }) => (
            <TranscriptSegmentRow
              key={segment.id}
              segment={segment}
              query={query}
              active={segment.id === activeSegmentId}
              onSeek={onSeek}
            />
          ))
        )}
      </div>
    </div>
  );
}
