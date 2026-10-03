import dns from "node:dns/promises";
import { AppError } from "@/lib/utils/errors";
import { validateOutboundHttpsBaseUrl } from "./outbound-url";

function assertResolvedAddressIsPublic(address: string): void {
  const normalized = address.toLowerCase();
  if (normalized.includes(":")) {
    if (normalized === "::1") {
      throw new AppError("INVALID_PROVIDER", "A base URL aponta para um destino não permitido.");
    }
    if (normalized.startsWith("fc") || normalized.startsWith("fd") || normalized.startsWith("fe80:")) {
      throw new AppError("INVALID_PROVIDER", "A base URL aponta para um destino não permitido.");
    }
    return;
  }

  const match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(normalized);
  if (!match) return;
  const octets = match.slice(1, 5).map((part) => Number(part));
  if (octets.some((value) => value > 255)) {
    throw new AppError("INVALID_PROVIDER", "A base URL aponta para um destino não permitido.");
  }
  const [a, b] = octets;
  if (
    a === 10
    || a === 127
    || a === 0
    || (a === 169 && b === 254)
    || (a === 172 && b >= 16 && b <= 31)
    || (a === 192 && b === 168)
  ) {
    throw new AppError("INVALID_PROVIDER", "A base URL aponta para um destino não permitido.");
  }
}

/** Rejects decimal / octal hostnames and private IPs after DNS resolution. */
export async function assertResolvedHostIsPublic(hostname: string): Promise<void> {
  const host = hostname.toLowerCase();
  if (/^\d+$/.test(host)) {
    throw new AppError("INVALID_PROVIDER", "A base URL aponta para um destino não permitido.");
  }

  let addresses: Array<{ address: string; family: number }>;
  try {
    addresses = await dns.lookup(host, { all: true, verbatim: true });
  } catch {
    throw new AppError("INVALID_PROVIDER", "Não foi possível resolver o host da base URL.");
  }

  if (addresses.length === 0) {
    throw new AppError("INVALID_PROVIDER", "Não foi possível resolver o host da base URL.");
  }

  for (const entry of addresses) {
    assertResolvedAddressIsPublic(entry.address);
  }
}

/** HTTPS fetch for user-supplied OpenAI-compatible endpoints (no redirects, DNS-checked). */
export async function secureProviderHttpsFetch(url: string, init: RequestInit): Promise<Response> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new AppError("INVALID_PROVIDER", "A base URL informada é inválida.");
  }

  validateOutboundHttpsBaseUrl(parsed.origin);
  await assertResolvedHostIsPublic(parsed.hostname);

  let response: Response;
  try {
    response = await fetch(url, { ...init, redirect: "manual" });
  } catch (error) {
    if (init.signal?.aborted || (error instanceof Error && error.name === "AbortError")) {
      throw new AppError("CHAT_FAILED", "O chat foi cancelado.");
    }
    throw new AppError("CHAT_FAILED", "Não foi possível contatar o provedor de chat.");
  }

  if (response.status >= 300 && response.status < 400) {
    throw new AppError("INVALID_PROVIDER", "Redirecionamento do provedor não é permitido.");
  }

  return response;
}
