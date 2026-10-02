/** Formats a non-negative duration in seconds as m:ss or h:mm:ss. */
export function formatTimestamp(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3_600);
  const minutes = Math.floor((total % 3_600) / 60);
  const remaining = total % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`;
  }
  return `${minutes}:${String(remaining).padStart(2, "0")}`;
}

/** Formats seconds as SRT/VTT clock `HH:MM:SS,mmm` or `HH:MM:SS.mmm`. */
export function formatSubtitleClock(seconds: number, separator: "," | "." = ","): string {
  if (!Number.isFinite(seconds) || seconds < 0) seconds = 0;
  const totalMillis = Math.round(seconds * 1_000);
  const hours = Math.floor(totalMillis / 3_600_000);
  const minutes = Math.floor((totalMillis % 3_600_000) / 60_000);
  const secs = Math.floor((totalMillis % 60_000) / 1_000);
  const millis = totalMillis % 1_000;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}${separator}${String(millis).padStart(3, "0")}`;
}
