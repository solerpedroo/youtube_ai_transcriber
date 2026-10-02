import { AppError } from "@/lib/utils/errors";

/** Soft cap keeps request bodies and temp files bounded. */
export const MAX_COOKIES_BYTES = 1_048_576;

/**
 * Validates a Netscape-format cookies.txt payload.
 * Safe for browser and server. Never log the returned content.
 */
export function validateNetscapeCookies(raw: string): string {
  if (typeof raw !== "string" || !raw.trim()) {
    throw new AppError("INVALID_COOKIES", "Envie um arquivo cookies.txt no formato Netscape.");
  }

  const normalized = raw.replace(/\r\n/g, "\n");
  const byteLength = typeof Buffer !== "undefined"
    ? Buffer.byteLength(normalized, "utf8")
    : new TextEncoder().encode(normalized).length;

  if (byteLength > MAX_COOKIES_BYTES) {
    throw new AppError("INVALID_COOKIES", "O arquivo de cookies excede o tamanho máximo permitido (1 MB).");
  }

  const lines = normalized.split("\n").map((line) => line.trimEnd()).filter((line) => line.length > 0);
  const cookieLines = lines.filter((line) => !line.startsWith("#"));
  if (cookieLines.length === 0) {
    throw new AppError("INVALID_COOKIES", "O arquivo de cookies não contém entradas utilizáveis.");
  }

  const netscapeLines = cookieLines.filter((line) => {
    const parts = line.split("\t");
    return parts.length >= 7 && parts[0]!.length > 0 && parts[5]!.length > 0;
  });

  if (netscapeLines.length === 0) {
    throw new AppError(
      "INVALID_COOKIES",
      "O arquivo precisa estar no formato Netscape (campos separados por tab).",
    );
  }

  return normalized;
}
