import type { AppSettings } from "@/types";
import { STORAGE_KEY, storageAdapter } from "./adapter";
import { createDefaultAppState, migrateAppState, type PersistedAppState } from "./migrations";

function readState(): PersistedAppState {
  return migrateAppState(storageAdapter.get<unknown>(STORAGE_KEY, createDefaultAppState()));
}

export function getSettings(): AppSettings {
  return readState().settings;
}

export function saveSettings(settings: AppSettings): void {
  const state = readState();
  storageAdapter.set(STORAGE_KEY, { ...state, settings });
}
