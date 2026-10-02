import { NextResponse } from "next/server";
import { z } from "zod";
import { isAppError } from "@/lib/utils/errors";
import { extractSubtitles } from "@/lib/youtube/subtitles";

export const runtime = "nodejs";

const RequestSchema = z.object({
  url: z.string().trim().min(1).max(2_048),
  language: z.string().trim().min(2).max(16).optional(),
});

function statusForCode(code: string): number {
  if (code === "INVALID_URL") return 400;
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
