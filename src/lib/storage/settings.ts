import type { AppSettings } from "@/types";
import {
  mergeApiKeysIntoSettings,
  persistApiKeysFromSettings,
  stripApiKeysFromSettings,
} from "./api-keys-session";
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
  const state = migrateAppState(storageAdapter.get<unknown>(STORAGE_KEY, createDefaultAppState()));
  const merged = mergeApiKeysIntoSettings(state.settings);
  const hadPersistedKeys =
    state.settings.chatProvider.apiKey.trim().length > 0
    || state.settings.transcriptionProvider.apiKey.trim().length > 0;
  if (hadPersistedKeys) {
    persistApiKeysFromSettings(merged);
    storageAdapter.set(STORAGE_KEY, { ...state, settings: stripApiKeysFromSettings(merged) });
  }
  return { ...state, settings: merged };
}

export function getSettings(): AppSettings {
  const state = readState();
  const settings = migrateChatProviderSettings(state.settings);
  if (settings !== state.settings) {
    persistApiKeysFromSettings(settings);
    storageAdapter.set(STORAGE_KEY, { ...state, settings: stripApiKeysFromSettings(settings) });
  }
  return settings;
}

export function saveSettings(settings: AppSettings): void {
  const state = readState();
  persistApiKeysFromSettings(settings);
  storageAdapter.set(STORAGE_KEY, { ...state, settings: stripApiKeysFromSettings(settings) });
}
