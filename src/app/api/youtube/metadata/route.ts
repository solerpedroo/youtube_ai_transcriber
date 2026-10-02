import { NextResponse } from "next/server";
import { z } from "zod";
import { isAppError } from "@/lib/utils/errors";
import { getVideoMetadata } from "@/lib/youtube/metadata";

export const runtime = "nodejs";

const RequestSchema = z.object({ url: z.string().trim().min(1).max(2_048) });

export async function POST(request: Request) {
  try {
    const body = RequestSchema.safeParse(await request.json());
    if (!body.success) {
      return NextResponse.json({ code: "INVALID_URL", message: "Informe uma URL válida do YouTube." }, { status: 400 });
    }

    return NextResponse.json(await getVideoMetadata(body.data.url));
  } catch (error) {
    if (isAppError(error)) {
      const status = error.code === "INVALID_URL" ? 400 : error.code === "YTDLP_UNAVAILABLE" || error.code === "PROCESS_UNAVAILABLE" ? 503 : error.code === "VIDEO_NOT_FOUND" ? 404 : error.code === "VIDEO_PRIVATE" || error.code === "AUTH_REQUIRED" ? 403 : 422;
      return NextResponse.json({ code: error.code, message: error.message }, { status });
    }
    return NextResponse.json({ code: "METADATA_EXTRACTION_FAILED", message: "Não foi possível obter os dados do vídeo." }, { status: 500 });
  }
}
