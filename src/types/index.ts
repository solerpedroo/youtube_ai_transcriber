export * from "./chat";
export * from "./settings";
export * from "./transcript";
export * from "./video";

import { z } from "zod";
import { ConversationSchema } from "./chat";
import { TranscriptSchema } from "./transcript";
import { VideoMetadataSchema } from "./video";

export const VideoProjectSchema = z.object({
  id: z.string().min(1),
  metadata: VideoMetadataSchema,
  transcript: TranscriptSchema.optional(),
  conversations: z.array(ConversationSchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
