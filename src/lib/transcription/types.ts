import type { TranscriptSegment } from "@/types";
import type { TranscriptionProviderId } from "@/types";

export type TranscriptionStatus =
  | "idle"
  | "downloading_audio"
  | "processing_audio"
  | "chunking_audio"
  | "transcribing"
  | "merging"
  | "complete"
  | "error";

export type AudioChunk = {
  index: number;
  startSeconds: number;
  endSeconds: number;
  path: string;
};

export type TranscriptionOptions = {
  apiKey: string;
  model: string;
  language?: string;
};

export type TranscriptionResult = {
  language?: string;
  segments: TranscriptSegment[];
  fullText: string;
};

export type TranscriptionProvider = {
  id: TranscriptionProviderId;
  transcribe(filePath: string, options: TranscriptionOptions): Promise<TranscriptionResult>;
};

export type TranscriptionProgressEvent =
  | {
      type: "status";
      status: Exclude<TranscriptionStatus, "idle" | "complete" | "error">;
      current?: number;
      total?: number;
      message?: string;
    }
  | {
      type: "complete";
      transcript: {
        language?: string;
        segments: TranscriptSegment[];
        fullText: string;
      };
    }
  | {
      type: "error";
      code: string;
      message: string;
    };

export const DEFAULT_CHUNK_SECONDS = 480;
export const DEFAULT_TRANSCRIPTION_CONCURRENCY = 2;
