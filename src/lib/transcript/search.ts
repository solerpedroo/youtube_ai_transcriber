import type { TranscriptSegment } from "@/types";

export type TranscriptSearchHit = {
  segment: TranscriptSegment;
  index: number;
};

/** Case-insensitive substring search over transcript segment text. */
export function searchTranscriptSegments(
  segments: readonly TranscriptSegment[],
  query: string,
): TranscriptSearchHit[] {
  const normalized = query.trim().toLocaleLowerCase();
  if (!normalized) return segments.map((segment, index) => ({ segment, index }));

  return segments.flatMap((segment, index) => {
    if (!segment.text.toLocaleLowerCase().includes(normalized)) return [];
    return [{ segment, index }];
  });
}

export function findActiveSegmentIndex(
  segments: readonly TranscriptSegment[],
  currentSeconds: number,
): number {
  if (!Number.isFinite(currentSeconds) || segments.length === 0) return -1;
  for (let index = segments.length - 1; index >= 0; index -= 1) {
    const segment = segments[index]!;
    if (currentSeconds >= segment.start && currentSeconds < segment.end) return index;
    if (currentSeconds >= segment.start && index === segments.length - 1) return index;
  }
  // Prefer the latest segment that has already started.
  for (let index = segments.length - 1; index >= 0; index -= 1) {
    if (currentSeconds >= segments[index]!.start) return index;
  }
  return -1;
}
