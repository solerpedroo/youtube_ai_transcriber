import { z } from "zod";
import type { TranscriptCitation } from "./transcript";
import { TranscriptCitationSchema } from "./transcript";

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
  citations?: TranscriptCitation[];
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export const ChatRoleSchema = z.enum(["user", "assistant"]);

export const ChatMessageSchema = z.object({
  id: z.string().min(1),
  role: ChatRoleSchema,
  content: z.string(),
  createdAt: z.string().datetime(),
  citations: z.array(TranscriptCitationSchema).optional(),
});

export const ConversationSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  messages: z.array(ChatMessageSchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
