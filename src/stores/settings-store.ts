import { create } from "zustand";
import type { AppSettings } from "@/types";
import { DEFAULT_SETTINGS } from "@/types";
import * as settingsStorage from "@/lib/storage/settings";

type SettingsStore = {
  settings: AppSettings;
  hasHydrated: boolean;
  hydrate: () => void;
  updateSettings: (changes: Partial<AppSettings>) => void;
  replaceSettings: (settings: AppSettings) => void;
  resetSettings: () => void;
};

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: {
    ...DEFAULT_SETTINGS,
    chatProvider: { ...DEFAULT_SETTINGS.chatProvider },
    transcriptionProvider: { ...DEFAULT_SETTINGS.transcriptionProvider },
  },
  hasHydrated: false,
  hydrate: () => set({ settings: settingsStorage.getSettings(), hasHydrated: true }),
  updateSettings: (changes) => set((state) => {
    const settings = { ...state.settings, ...changes };
    settingsStorage.saveSettings(settings);
    return { settings };
  }),
  replaceSettings: (settings) => {
    settingsStorage.saveSettings(settings);
    set({ settings });
  },
  resetSettings: () => {
    const settings: AppSettings = {
      ...DEFAULT_SETTINGS,
      chatProvider: { ...DEFAULT_SETTINGS.chatProvider },
      transcriptionProvider: { ...DEFAULT_SETTINGS.transcriptionProvider },
    };
    settingsStorage.saveSettings(settings);
    set({ settings });
  },
}));
