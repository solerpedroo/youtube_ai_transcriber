import type { TranscriptCitation } from "@/types";

/** Matches [m:ss], [mm:ss], or [h:mm:ss] citation markers. */
const TIMESTAMP_PATTERN = /\[(?:(\d{1,2}):)?(\d{1,2}):(\d{2})\]/g;

function toSeconds(hours: string | undefined, minutes: string, seconds: string): number {
  const hrs = hours ? Number(hours) : 0;
  return hrs * 3_600 + Number(minutes) * 60 + Number(seconds);
}

function parseMatch(match: RegExpMatchArray): { seconds: number; label: string } {
  const label = match[0].slice(1, -1);
  const seconds = toSeconds(match[1], match[2]!, match[3]!);
  return { seconds, label };
}

/** Parses assistant timestamp markers like [12:31] or [1:02:03] into citations. */
export function extractCitations(content: string): TranscriptCitation[] {
  const citations: TranscriptCitation[] = [];
  const seen = new Set<number>();

  for (const match of content.matchAll(TIMESTAMP_PATTERN)) {
    const { seconds } = parseMatch(match);
    if (!Number.isFinite(seconds) || seen.has(seconds)) continue;
    seen.add(seconds);
    citations.push({ start: seconds });
  }

  return citations.sort((left, right) => left.start - right.start);
}

export type CitationPart =
  | { type: "text"; value: string }
  | { type: "citation"; seconds: number; label: string };

/** Splits assistant content into text and clickable citation parts. */
/** Turns [m:ss] markers into in-app seek links consumed by ChatMarkdown. */
export function contentToMarkdownWithSeekLinks(content: string): string {
  return content.replace(TIMESTAMP_PATTERN, (match, hours, minutes, seconds) => {
    const label = match.slice(1, -1);
    const seekSeconds = toSeconds(hours, minutes, seconds);
    return `[${label}](#seek-${seekSeconds})`;
  });
}

export function splitContentWithCitations(content: string): CitationPart[] {
  const parts: CitationPart[] = [];
  let lastIndex = 0;

  for (const match of content.matchAll(TIMESTAMP_PATTERN)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      parts.push({ type: "text", value: content.slice(lastIndex, index) });
    }
    const { seconds, label } = parseMatch(match);
    parts.push({ type: "citation", seconds, label });
    lastIndex = index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push({ type: "text", value: content.slice(lastIndex) });
  }

  return parts.length > 0 ? parts : [{ type: "text", value: content }];
}
