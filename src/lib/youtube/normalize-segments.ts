import type { TranscriptSegment } from "@/types";
import type { SubtitleSegment } from "./subtitle-types";

function collapseWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/**
 * Normalizes raw subtitle cues into transcript segments.
 * Deduplicates consecutive identical text and collapses overlapping
 * rolling captions common in automatic YouTube VTT files.
 */
export function normalizeSubtitleSegments(segments: readonly SubtitleSegment[]): TranscriptSegment[] {
  const cleaned = segments
    .map((segment) => ({
      start: segment.start,
      end: segment.end,
      text: collapseWhitespace(segment.text),
    }))
    .filter((segment) => segment.text.length > 0 && Number.isFinite(segment.start) && Number.isFinite(segment.end) && segment.end >= segment.start)
    .sort((left, right) => left.start - right.start || left.end - right.end);

  const merged: Array<{ start: number; end: number; text: string }> = [];

  for (const segment of cleaned) {
    const previous = merged.at(-1);
    if (!previous) {
      merged.push({ ...segment });
      continue;
    }

    if (previous.text === segment.text) {
      previous.end = Math.max(previous.end, segment.end);
      continue;
    }

    if (
      segment.start <= previous.end
      && segment.text.startsWith(previous.text)
      && segment.text.length > previous.text.length
    ) {
      previous.text = segment.text;
      previous.end = Math.max(previous.end, segment.end);
      continue;
    }

    if (
      segment.start <= previous.end
      && previous.text.endsWith(segment.text)
    ) {
      previous.end = Math.max(previous.end, segment.end);
      continue;
    }

    merged.push({ ...segment });
  }

  return merged.map((segment, index) => ({
    id: `caption-${index + 1}`,
    start: segment.start,
    end: segment.end,
    text: segment.text,
  }));
}

export function buildFullText(segments: readonly TranscriptSegment[]): string {
  return segments.map((segment) => segment.text).join(" ").replace(/\s+/g, " ").trim();
}
