import { NextResponse } from "next/server";
import { z } from "zod";
import { isAppError } from "@/lib/utils/errors";
import { guardApiRequest, readJsonBodyWithLimit } from "@/lib/security/api-request-guard";
import { OptionalCookiesSchema } from "@/lib/youtube/cookies-schema";
import { extractSubtitles } from "@/lib/youtube/subtitles";
import { YouTubeUrlSchema } from "@/lib/youtube/url";

export const runtime = "nodejs";
export const maxDuration = 120;

const LanguageSchema = z.string().trim().regex(
  /^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})?$/,
  "Informe um código de idioma válido.",
);

const RequestSchema = z.object({
  url: YouTubeUrlSchema,
  language: LanguageSchema.optional(),
  cookies: OptionalCookiesSchema,
});

function statusForCode(code: string): number {
  if (code === "INVALID_URL" || code === "INVALID_LANGUAGE" || code === "INVALID_COOKIES") return 400;
  if (code === "YTDLP_UNAVAILABLE" || code === "PROCESS_UNAVAILABLE") return 503;
  if (code === "VIDEO_NOT_FOUND" || code === "SUBTITLES_NOT_FOUND") return 404;
  if (code === "VIDEO_PRIVATE" || code === "AUTH_REQUIRED") return 403;
  if (code === "PROCESS_TIMEOUT") return 504;
  return 422;
}

export async function POST(request: Request) {
  const blocked = guardApiRequest(request, { profile: "youtube", maxBodyBytes: 1_100_000 });
  if (blocked) return blocked;

  const parsedBody = await readJsonBodyWithLimit(request, 1_100_000);
  if (!parsedBody.ok) return parsedBody.response;
  const payload = parsedBody.payload;

  try {
    const body = RequestSchema.safeParse(payload);
    if (!body.success) {
      const hasLanguageError = body.error.issues.some((issue) => issue.path[0] === "language");
      const hasCookiesError = body.error.issues.some((issue) => issue.path[0] === "cookies");
      const hasUrlError = body.error.issues.some((issue) => issue.path[0] === "url");
      if (hasCookiesError) {
        return NextResponse.json({
          code: "INVALID_COOKIES",
          message: "O arquivo de cookies é inválido ou excede o tamanho permitido.",
        }, { status: 400 });
      }
      if (hasLanguageError && !hasUrlError) {
        return NextResponse.json({ code: "INVALID_LANGUAGE", message: "Informe um código de idioma válido." }, { status: 400 });
      }
      return NextResponse.json({ code: "INVALID_URL", message: "Informe uma URL válida do YouTube." }, { status: 400 });
    }

    return NextResponse.json(await extractSubtitles(body.data.url.url, body.data.language, body.data.cookies));
  } catch (error) {
    if (isAppError(error)) {
      return NextResponse.json({ code: error.code, message: error.message }, { status: statusForCode(error.code) });
    }
    return NextResponse.json({ code: "SUBTITLE_EXTRACTION_FAILED", message: "Não foi possível extrair as legendas do vídeo." }, { status: 500 });
  }
}
