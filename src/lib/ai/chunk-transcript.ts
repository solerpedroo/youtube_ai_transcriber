import type { TranscriptChunk, TranscriptSegment } from "@/types";

/** Approximate target size for a retrieved chunk (~500-1200 tokens as characters). */
export const CHUNK_TARGET_CHARS = 2_800;
export const CHUNK_OVERLAP_CHARS = 240;

function flushChunk(
  chunks: TranscriptChunk[],
  texts: string[],
  start: number,
  end: number,
): void {
  const text = texts.join(" ").replace(/\s+/g, " ").trim();
  if (!text) return;
  chunks.push({
    id: `chunk-${chunks.length + 1}`,
    start,
    end,
    text,
  });
}

/** Groups timed transcript segments into overlapping text chunks for retrieval. */
export function chunkTranscriptSegments(
  segments: readonly TranscriptSegment[],
  targetChars: number = CHUNK_TARGET_CHARS,
  overlapChars: number = CHUNK_OVERLAP_CHARS,
): TranscriptChunk[] {
  if (segments.length === 0) return [];
  if (!Number.isFinite(targetChars) || targetChars <= 0) {
    throw new Error("targetChars must be positive.");
  }

  const usable = segments
    .map((segment) => ({ ...segment, text: segment.text.trim() }))
    .filter((segment) => segment.text.length > 0);
  if (usable.length === 0) return [];

  const chunks: TranscriptChunk[] = [];
  let indexes: number[] = [];
  let size = 0;

  for (let index = 0; index < usable.length; index += 1) {
    const text = usable[index]!.text;
    const nextSize = size === 0 ? text.length : size + 1 + text.length;

    if (size > 0 && nextSize > targetChars) {
      flushChunk(
        chunks,
        indexes.map((partIndex) => usable[partIndex]!.text),
        usable[indexes[0]!]!.start,
        usable[indexes.at(-1)!]!.end,
      );

      const overlapIndexes: number[] = [];
      let overlapSize = 0;
      for (let cursor = indexes.length - 1; cursor >= 0; cursor -= 1) {
        const partIndex = indexes[cursor]!;
        const candidate = usable[partIndex]!.text;
        const candidateSize = overlapSize === 0 ? candidate.length : overlapSize + 1 + candidate.length;
        if (candidateSize > overlapChars && overlapIndexes.length > 0) break;
        overlapIndexes.unshift(partIndex);
        overlapSize = candidateSize;
      }

      indexes = [...overlapIndexes, index];
      size = indexes.map((partIndex) => usable[partIndex]!.text).join(" ").length;
      continue;
    }

    indexes.push(index);
    size = nextSize;
  }

  flushChunk(
    chunks,
    indexes.map((partIndex) => usable[partIndex]!.text),
    usable[indexes[0]!]!.start,
    usable[indexes.at(-1)!]!.end,
  );

  return chunks;
}

export function formatChunkForPrompt(chunk: TranscriptChunk): string {
  return `[${formatClock(chunk.start)} - ${formatClock(chunk.end)}]\n${chunk.text}`;
}

function formatClock(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(total / 3_600);
  const minutes = Math.floor((total % 3_600) / 60);
  const remaining = total % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`;
  }
  return `${minutes}:${String(remaining).padStart(2, "0")}`;
}
