type RateLimitProfile = "chat" | "transcription" | "youtube";

const LIMITS: Record<RateLimitProfile, { max: number; windowMs: number }> = {
  chat: { max: 40, windowMs: 60_000 },
  transcription: { max: 6, windowMs: 60_000 },
  youtube: { max: 30, windowMs: 60_000 },
};

const buckets = new Map<string, { count: number; resetAt: number }>();

function clientKey(request: Request): string {
  if (process.env.TRUST_PROXY === "true") {
    const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    if (forwarded) return forwarded;
    const realIp = request.headers.get("x-real-ip")?.trim();
    if (realIp) return realIp;
  }
  return "local";
}

function checkRateLimit(key: string, profile: RateLimitProfile): { ok: true } | { ok: false; retryAfterSec: number } {
  const { max, windowMs } = LIMITS[profile];
  const now = Date.now();
  const bucketKey = `${profile}:${key}`;
  const current = buckets.get(bucketKey);
  if (!current || now >= current.resetAt) {
    buckets.set(bucketKey, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }
  if (current.count >= max) {
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
  }
  current.count += 1;
  return { ok: true };
}

function assertSameOriginWhenPublic(request: Request): Response | null {
  if (process.env.API_ACCESS_SECRET?.trim()) return null;

  const host = request.headers.get("host")?.toLowerCase();
  if (!host) return null;

  const origin = request.headers.get("origin");
  if (origin) {
    try {
      if (new URL(origin).host.toLowerCase() !== host) {
        return Response.json(
          { code: "FORBIDDEN", message: "Origem da requisição não permitida." },
          { status: 403 },
        );
      }
    } catch {
      return Response.json(
        { code: "FORBIDDEN", message: "Origem da requisição não permitida." },
        { status: 403 },
      );
    }
    return null;
  }

  const referer = request.headers.get("referer");
  if (referer) {
    try {
      if (new URL(referer).host.toLowerCase() !== host) {
        return Response.json(
          { code: "FORBIDDEN", message: "Origem da requisição não permitida." },
          { status: 403 },
        );
      }
    } catch {
      return Response.json(
        { code: "FORBIDDEN", message: "Origem da requisição não permitida." },
        { status: 403 },
      );
    }
    return null;
  }

  return Response.json(
    { code: "FORBIDDEN", message: "Origem da requisição não permitida." },
    { status: 403 },
  );
}

/** Optional shared secret for deployments expostas (env API_ACCESS_SECRET). */
export function assertApiAccess(request: Request): Response | null {
  const secret = process.env.API_ACCESS_SECRET?.trim();
  if (!secret) return null;

  const headerSecret =
    request.headers.get("x-api-access-secret")
    ?? request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();

  if (headerSecret !== secret) {
    return Response.json(
      { code: "UNAUTHORIZED", message: "Credencial de acesso à API inválida ou ausente." },
      { status: 401 },
    );
  }
  return null;
}

export function assertBodySize(request: Request, maxBytes: number): Response | null {
  const raw = request.headers.get("content-length");
  if (!raw) return null;
  const length = Number(raw);
  if (!Number.isFinite(length) || length <= maxBytes) return null;
  return Response.json(
    { code: "PAYLOAD_TOO_LARGE", message: "O corpo da requisição excede o tamanho permitido." },
    { status: 413 },
  );
}

export function assertRateLimit(request: Request, profile: RateLimitProfile): Response | null {
  const result = checkRateLimit(clientKey(request), profile);
  if (result.ok) return null;
  return Response.json(
    { code: "RATE_LIMITED", message: "Muitas requisições. Tente novamente em instantes." },
    {
      status: 429,
      headers: { "Retry-After": String(result.retryAfterSec) },
    },
  );
}

export function guardApiRequest(
  request: Request,
  options: { profile: RateLimitProfile; maxBodyBytes: number },
): Response | null {
  return assertBodySize(request, options.maxBodyBytes)
    ?? assertSameOriginWhenPublic(request)
    ?? assertApiAccess(request)
    ?? assertRateLimit(request, options.profile);
}

export async function readJsonBodyWithLimit(
  request: Request,
  maxBytes: number,
): Promise<{ ok: true; payload: unknown } | { ok: false; response: Response }> {
  const body = request.body;
  if (!body) {
    return { ok: true, payload: undefined };
  }

  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
      if (received > maxBytes) {
        return {
          ok: false,
          response: Response.json(
            { code: "PAYLOAD_TOO_LARGE", message: "O corpo da requisição excede o tamanho permitido." },
            { status: 413 },
          ),
        };
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
  const merged = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }

  const text = new TextDecoder().decode(merged).trim();
  if (!text) {
    return { ok: true, payload: undefined };
  }

  try {
    return { ok: true, payload: JSON.parse(text) as unknown };
  } catch {
    return {
      ok: false,
      response: Response.json(
        { code: "INVALID_JSON", message: "Envie um corpo JSON válido." },
        { status: 400 },
      ),
    };
  }
}
