import type { TranscriptSegment } from "@/types";
import type { TranscriptionResult } from "./types";

function shiftSegment(segment: TranscriptSegment, offsetSeconds: number, id: string): TranscriptSegment {
  return {
    id,
    start: segment.start + offsetSeconds,
    end: segment.end + offsetSeconds,
    text: segment.text.trim(),
  };
}

/** Merges per-chunk transcription results using each chunk's start offset. */
export function mergeTranscriptChunks(
  chunkResults: ReadonlyArray<{ offsetSeconds: number; result: TranscriptionResult }>,
): TranscriptionResult {
  const segments: TranscriptSegment[] = [];
  let language: string | undefined;

  chunkResults.forEach(({ offsetSeconds, result }, chunkIndex) => {
    if (!language && result.language) language = result.language;
    result.segments.forEach((segment, segmentIndex) => {
      const shifted = shiftSegment(
        segment,
        offsetSeconds,
        `transcript-${chunkIndex + 1}-${segmentIndex + 1}`,
      );
      if (!shifted.text) return;
      if (!Number.isFinite(shifted.start) || !Number.isFinite(shifted.end) || shifted.end < shifted.start) return;
      segments.push(shifted);
    });
  });

  segments.sort((left, right) => left.start - right.start || left.end - right.end);

  return {
    language,
    segments,
    fullText: segments.map((segment) => segment.text).join(" ").replace(/\s+/g, " ").trim(),
  };
}
