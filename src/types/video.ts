import { z } from "zod";

import type { Conversation } from "./chat";
import type { Transcript } from "./transcript";

/** Metadata retained locally for a YouTube video. */
export interface VideoMetadata {
  videoId: string;
  title: string;
  channel?: string;
  duration: number;
  thumbnail?: string;
  url: string;
}

export interface VideoProject {
  id: string;
  metadata: VideoMetadata;
  transcript?: Transcript;
  conversations: Conversation[];
  createdAt: string;
  updatedAt: string;
}

export const VideoMetadataSchema = z.object({
  videoId: z.string().min(1),
  title: z.string(),
  channel: z.string().optional(),
  duration: z.number().finite().nonnegative(),
  thumbnail: z.string().url().optional(),
  url: z.string().url(),
});
