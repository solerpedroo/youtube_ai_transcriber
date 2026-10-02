import type { SubtitleSegment } from "./subtitle-types";

const TIMESTAMP_PATTERN =
  /^(?:(\d{2,}):)?(\d{2}):(\d{2})\.(\d{3})\s*-->\s*(?:(\d{2,}):)?(\d{2}):(\d{2})\.(\d{3})(?:\s+.*)?$/;

function parseClock(
  hours: string | undefined,
  minutes: string,
  seconds: string,
  millis: string,
): number {
  const totalHours = hours ? Number(hours) : 0;
  return totalHours * 3_600 + Number(minutes) * 60 + Number(seconds) + Number(millis) / 1_000;
}

function stripMarkup(text: string): string {
  return text
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/** Parses WebVTT content into timed text segments without generating IDs. */
export function parseVtt(content: string): SubtitleSegment[] {
  const normalized = content.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  const blocks = normalized.split(/\n\n+/);
  const segments: SubtitleSegment[] = [];

  for (const block of blocks) {
    const lines = block.split("\n").map((line) => line.trimEnd()).filter((line, index, all) => !(index === 0 && line === "" && all.length > 1));
    if (lines.length === 0) continue;

    const timeLineIndex = lines.findIndex((line) => TIMESTAMP_PATTERN.test(line.trim()));
    if (timeLineIndex === -1) continue;

    const timeMatch = lines[timeLineIndex]!.trim().match(TIMESTAMP_PATTERN);
    if (!timeMatch) continue;

    const start = parseClock(timeMatch[1], timeMatch[2]!, timeMatch[3]!, timeMatch[4]!);
    const end = parseClock(timeMatch[5], timeMatch[6]!, timeMatch[7]!, timeMatch[8]!);
    const text = stripMarkup(lines.slice(timeLineIndex + 1).join(" "));
    if (!text || !Number.isFinite(start) || !Number.isFinite(end) || end < start) continue;

    segments.push({ start, end, text });
  }

  return segments;
}
