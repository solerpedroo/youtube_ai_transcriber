import { NextResponse } from "next/server";
import { z } from "zod";
import { isAppError } from "@/lib/utils/errors";
import { extractSubtitles } from "@/lib/youtube/subtitles";

export const runtime = "nodejs";

const LanguageSchema = z.string().trim().regex(
  /^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})?$/,
  "Informe um código de idioma válido.",
);

const RequestSchema = z.object({
  url: z.string().trim().min(1).max(2_048),
  language: LanguageSchema.optional(),
});

function statusForCode(code: string): number {
  if (code === "INVALID_URL" || code === "INVALID_LANGUAGE") return 400;
  if (code === "YTDLP_UNAVAILABLE" || code === "PROCESS_UNAVAILABLE") return 503;
  if (code === "VIDEO_NOT_FOUND" || code === "SUBTITLES_NOT_FOUND") return 404;
  if (code === "VIDEO_PRIVATE" || code === "AUTH_REQUIRED") return 403;
  if (code === "PROCESS_TIMEOUT") return 504;
  return 422;
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ code: "INVALID_URL", message: "Envie um corpo JSON válido." }, { status: 400 });
  }

  try {
    const body = RequestSchema.safeParse(payload);
    if (!body.success) {
      const hasLanguageError = body.error.issues.some((issue) => issue.path[0] === "language");
      const hasUrlError = body.error.issues.some((issue) => issue.path[0] === "url");
      if (hasLanguageError && !hasUrlError) {
        return NextResponse.json({ code: "INVALID_LANGUAGE", message: "Informe um código de idioma válido." }, { status: 400 });
      }
      return NextResponse.json({ code: "INVALID_URL", message: "Informe uma URL válida do YouTube." }, { status: 400 });
    }

    return NextResponse.json(await extractSubtitles(body.data.url, body.data.language));
  } catch (error) {
    if (isAppError(error)) {
      return NextResponse.json({ code: error.code, message: error.message }, { status: statusForCode(error.code) });
    }
    return NextResponse.json({ code: "SUBTITLE_EXTRACTION_FAILED", message: "Não foi possível extrair as legendas do vídeo." }, { status: 500 });
  }
}
