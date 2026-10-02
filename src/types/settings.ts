export type AIProviderId =
  | "openai"
  | "anthropic"
  | "gemini"
  | "groq"
  | "openai-compatible";

export type TranscriptionProviderId = "openai" | "groq";
export type ThemePreference = "light" | "dark" | "system";

/**
 * API keys are intentionally local-only. They must never be logged, sent to
 * analytics, or persisted by a server.
 */
export interface AIProviderConfig {
  provider: AIProviderId;
  apiKey: string;
  model: string;
  baseUrl?: string;
}

export interface TranscriptionProviderConfig {
  provider: TranscriptionProviderId;
  apiKey: string;
  model: string;
}

export interface AppSettings {
  chatProvider: AIProviderConfig;
  transcriptionProvider: TranscriptionProviderConfig;
  theme: ThemePreference;
}

export const DEFAULT_SETTINGS: AppSettings = {
  chatProvider: {
    provider: "openai",
    apiKey: "",
    model: "gpt-4.1-mini",
  },
  transcriptionProvider: {
    provider: "groq",
    apiKey: "",
    model: "whisper-large-v3-turbo",
  },
  theme: "system",
};

export const AIProviderIdSchema = z.enum([
  "openai",
  "anthropic",
  "gemini",
  "groq",
  "openai-compatible",
]);
export const TranscriptionProviderIdSchema = z.enum(["openai", "groq"]);
export const ThemePreferenceSchema = z.enum(["light", "dark", "system"]);

export const AIProviderConfigSchema = z.object({
  provider: AIProviderIdSchema,
  apiKey: z.string(),
  model: z.string(),
  baseUrl: z.string().url().optional(),
});

export const TranscriptionProviderConfigSchema = z.object({
  provider: TranscriptionProviderIdSchema,
  apiKey: z.string(),
  model: z.string(),
});

export const AppSettingsSchema = z.object({
  chatProvider: AIProviderConfigSchema,
  transcriptionProvider: TranscriptionProviderConfigSchema,
  theme: ThemePreferenceSchema,
});
import { z } from "zod";
