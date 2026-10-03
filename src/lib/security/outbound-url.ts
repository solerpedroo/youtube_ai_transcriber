import { AppError } from "@/lib/utils/errors";

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "metadata.google.internal",
  "169.254.169.254",
]);

function isPrivateIpv4(hostname: string): boolean {
  const match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(hostname);
  if (!match) return false;
  const octets = match.slice(1, 5).map((part) => Number(part));
  if (octets.some((value) => value > 255)) return true;
  const [a, b] = octets;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  return false;
}

function isBlockedIpv6(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  if (normalized === "::1") return true;
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;
  if (normalized.startsWith("fe80:")) return true;
  return false;
}

function parseAllowedHosts(): Set<string> | null {
  const raw = process.env.OPENAI_COMPATIBLE_ALLOWED_HOSTS?.trim();
  if (!raw) return null;
  return new Set(
    raw.split(",").map((entry) => entry.trim().toLowerCase()).filter(Boolean),
  );
}

/** Validates HTTPS outbound base URLs for OpenAI-compatible providers (blocks SSRF targets). */
export function validateOutboundHttpsBaseUrl(raw: string): string {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new AppError("INVALID_PROVIDER", "A base URL informada é inválida.");
  }

  if (url.protocol !== "https:" || url.username || url.password || url.port) {
    throw new AppError("INVALID_PROVIDER", "A base URL deve ser HTTPS sem credenciais ou porta customizada.");
  }

  const hostname = url.hostname.toLowerCase();
  if (/^\d+$/.test(hostname)) {
    throw new AppError("INVALID_PROVIDER", "A base URL aponta para um destino não permitido.");
  }
  if (
    BLOCKED_HOSTNAMES.has(hostname)
    || hostname.endsWith(".local")
    || hostname.endsWith(".internal")
    || isPrivateIpv4(hostname)
    || isBlockedIpv6(hostname)
  ) {
    throw new AppError("INVALID_PROVIDER", "A base URL aponta para um destino não permitido.");
  }

  const allowlist = parseAllowedHosts();
  if (allowlist && !allowlist.has(hostname)) {
    throw new AppError(
      "INVALID_PROVIDER",
      "Este host não está na lista de destinos permitidos (OPENAI_COMPATIBLE_ALLOWED_HOSTS).",
    );
  }

  return `${url.origin}${url.pathname}`.replace(/\/$/, "");
}
