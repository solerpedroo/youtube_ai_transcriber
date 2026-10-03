import type { AppSettings } from "@/types";
import { STORAGE_KEY, storageAdapter } from "./adapter";
import { createDefaultAppState, migrateAppState, type PersistedAppState } from "./migrations";

/** Groq retired these chat model IDs for most self-serve accounts (2026). */
const GROQ_CHAT_MODEL_REPLACEMENTS: Record<string, string> = {
  "llama-3.3-70b-versatile": "openai/gpt-oss-120b",
  "llama-3.1-8b-instant": "openai/gpt-oss-20b",
};

function migrateChatProviderSettings(settings: AppSettings): AppSettings {
  if (settings.chatProvider.provider !== "groq") return settings;
  const replacement = GROQ_CHAT_MODEL_REPLACEMENTS[settings.chatProvider.model];
  if (!replacement) return settings;
  return {
    ...settings,
    chatProvider: { ...settings.chatProvider, model: replacement },
  };
}

function readState(): PersistedAppState {
  return migrateAppState(storageAdapter.get<unknown>(STORAGE_KEY, createDefaultAppState()));
}

export function getSettings(): AppSettings {
  const state = readState();
  const settings = migrateChatProviderSettings(state.settings);
  if (settings !== state.settings) {
    storageAdapter.set(STORAGE_KEY, { ...state, settings });
  }
  return settings;
}

export function saveSettings(settings: AppSettings): void {
  const state = readState();
  storageAdapter.set(STORAGE_KEY, { ...state, settings });
}
