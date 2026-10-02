import type { Transcript, VideoMetadata } from "@/types";
import { formatSubtitleClock, formatTimestamp } from "@/lib/utils/time";

export type TranscriptExportInput = {
  metadata: VideoMetadata;
  transcript: Transcript;
};

export function exportTranscriptTxt({ metadata, transcript }: TranscriptExportInput): string {
  const lines = [
    metadata.title,
    metadata.channel ? `Canal: ${metadata.channel}` : undefined,
    `URL: ${metadata.url}`,
    "",
    ...transcript.segments.map((segment) => `${formatTimestamp(segment.start)} ${segment.text}`),
  ];
  return lines.filter((line) => line !== undefined).join("\n").trim() + "\n";
}

export function exportTranscriptMarkdown({ metadata, transcript }: TranscriptExportInput): string {
  const body = transcript.segments.map((segment) => [
    `### ${formatTimestamp(segment.start)}`,
    "",
    segment.text,
    "",
  ].join("\n")).join("\n");

  return [
    `# ${metadata.title}`,
    "",
    metadata.channel ? `Channel: ${metadata.channel}` : undefined,
    `URL: ${metadata.url}`,
    "",
    "## Transcript",
    "",
    body.trim(),
    "",
  ].filter((line) => line !== undefined).join("\n");
}

export function exportTranscriptJson({ metadata, transcript }: TranscriptExportInput): string {
  return `${JSON.stringify({ metadata, transcript }, null, 2)}\n`;
}

export function exportTranscriptSrt(transcript: Transcript): string {
  return transcript.segments.map((segment, index) => [
    String(index + 1),
    `${formatSubtitleClock(segment.start, ",")} --> ${formatSubtitleClock(segment.end, ",")}`,
    segment.text,
    "",
  ].join("\n")).join("\n");
}

export function exportTranscriptVtt(transcript: Transcript): string {
  const cues = transcript.segments.map((segment) => [
    `${formatSubtitleClock(segment.start, ".")} --> ${formatSubtitleClock(segment.end, ".")}`,
    segment.text,
    "",
  ].join("\n")).join("\n");
  return `WEBVTT\n\n${cues}`;
}

export function downloadTextFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function slugifyFilename(value: string): string {
  const slug = value
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .toLowerCase();
  return slug || "transcript";
}
