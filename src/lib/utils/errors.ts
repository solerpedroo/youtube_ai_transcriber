export type ApiErrorCode =
  | "INVALID_URL"
  | "VIDEO_NOT_FOUND"
  | "VIDEO_PRIVATE"
  | "AUTH_REQUIRED"
  | "YTDLP_UNAVAILABLE"
  | "PROCESS_UNAVAILABLE"
  | "METADATA_EXTRACTION_FAILED"
  | "PROCESS_TIMEOUT"
  | "SUBTITLES_NOT_FOUND"
  | "SUBTITLE_EXTRACTION_FAILED";

export class AppError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    message: string,
    public readonly details?: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
