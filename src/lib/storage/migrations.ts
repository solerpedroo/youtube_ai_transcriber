import type { AppSettings, VideoProject } from "@/types";
import { AppSettingsSchema, DEFAULT_SETTINGS, VideoProjectSchema } from "@/types";

export const CURRENT_STORAGE_VERSION = 1;

export interface PersistedAppState {
  version: number;
  projects: VideoProject[];
  settings: AppSettings;
}

export const createDefaultAppState = (): PersistedAppState => ({
  version: CURRENT_STORAGE_VERSION,
  projects: [],
  settings: { ...DEFAULT_SETTINGS, chatProvider: { ...DEFAULT_SETTINGS.chatProvider }, transcriptionProvider: { ...DEFAULT_SETTINGS.transcriptionProvider } },
});

/**
 * Makes an older or malformed local value safe to consume. Future schema
 * upgrades belong here so storage callers remain version-agnostic.
 */
export function migrateAppState(value: unknown): PersistedAppState {
  const fallback = createDefaultAppState();
  if (!isRecord(value)) return fallback;

  const projects = Array.isArray(value.projects)
    ? value.projects.flatMap((project) => {
      const parsed = VideoProjectSchema.safeParse(project);
      return parsed.success ? [parsed.data] : [];
    })
    : fallback.projects;
  const settings = AppSettingsSchema.safeParse(value.settings);

  return {
    version: CURRENT_STORAGE_VERSION,
    projects,
    settings: settings.success ? settings.data : fallback.settings,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
