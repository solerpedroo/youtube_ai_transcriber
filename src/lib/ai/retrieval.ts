import type { TranscriptChunk } from "@/types";

const STOP_WORDS = new Set([
  "a", "o", "os", "as", "um", "uma", "de", "da", "do", "das", "dos", "e", "ou", "que", "se",
  "na", "no", "em", "para", "por", "com", "the", "and", "or", "of", "to", "in", "on", "for",
  "is", "are", "was", "were", "this", "that", "it", "as", "at", "be", "by", "an", "from",
]);

export type RetrievedChunk = TranscriptChunk & { score: number };

/** Extracts searchable terms from a free-text query. */
export function extractKeywords(query: string): string[] {
  const terms = query
    .toLocaleLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .map((term) => term.trim())
    .filter((term) => term.length >= 3 && !STOP_WORDS.has(term));
  return [...new Set(terms)];
}

function scoreChunk(chunk: TranscriptChunk, keywords: readonly string[]): number {
  if (keywords.length === 0) return 0;
  const haystack = chunk.text.toLocaleLowerCase();
  let score = 0;
  for (const keyword of keywords) {
    if (!haystack.includes(keyword)) continue;
    const occurrences = haystack.split(keyword).length - 1;
    score += 1 + Math.min(occurrences, 5) * 0.25;
  }
  return score;
}

/** Ranks transcript chunks by keyword overlap with the user question. */
export function retrieveTranscriptChunks(
  chunks: readonly TranscriptChunk[],
  query: string,
  topK = 8,
): RetrievedChunk[] {
  if (chunks.length === 0) return [];
  const keywords = extractKeywords(query);
  if (keywords.length === 0) {
    return chunks.slice(0, Math.min(topK, chunks.length)).map((chunk) => ({ ...chunk, score: 0 }));
  }

  return chunks
    .map((chunk) => ({ ...chunk, score: scoreChunk(chunk, keywords) }))
    .filter((chunk) => chunk.score > 0)
    .sort((left, right) => right.score - left.score || left.start - right.start)
    .slice(0, topK)
    .sort((left, right) => left.start - right.start);
}
