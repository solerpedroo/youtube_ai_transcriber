export interface TranscriptSegment {
  id: string;
  start: number;
  end: number;
  text: string;
}

export interface Transcript {
  id: string;
  videoId: string;
  language?: string;
  segments: TranscriptSegment[];
  fullText: string;
  createdAt: string;
}

export interface TranscriptCitation {
  start: number;
  end?: number;
  text?: string;
}

export interface TranscriptChunk {
  id: string;
  start: number;
  end: number;
  text: string;
}

export const TranscriptSegmentSchema = z.object({
  id: z.string().min(1),
  start: z.number().finite().nonnegative(),
  end: z.number().finite().nonnegative(),
  text: z.string(),
}).refine((segment) => segment.end >= segment.start, {
  message: "O término do segmento deve ser posterior ao início.",
  path: ["end"],
});

export const TranscriptSchema = z.object({
  id: z.string().min(1),
  videoId: z.string().min(1),
  language: z.string().min(1).optional(),
  segments: z.array(TranscriptSegmentSchema),
  fullText: z.string(),
  createdAt: z.string().datetime(),
});

export const TranscriptCitationSchema = z.object({
  start: z.number().finite().nonnegative(),
  end: z.number().finite().nonnegative().optional(),
  text: z.string().optional(),
}).refine((citation) => citation.end === undefined || citation.end >= citation.start, {
  message: "O término da citação deve ser posterior ao início.",
  path: ["end"],
});
import { z } from "zod";
