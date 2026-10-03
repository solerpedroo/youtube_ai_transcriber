import type { VideoProject } from "@/types";
import {
  mergeApiKeysIntoSettings,
  persistApiKeysFromSettings,
  stripApiKeysFromSettings,
} from "./api-keys-session";
import { STORAGE_KEY, storageAdapter } from "./adapter";
import { createDefaultAppState, migrateAppState, type PersistedAppState } from "./migrations";

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

function writeState(nextState: PersistedAppState): void {
  persistApiKeysFromSettings(nextState.settings);
  storageAdapter.set(STORAGE_KEY, {
    ...nextState,
    settings: stripApiKeysFromSettings(nextState.settings),
  });
}

export function getProjects(): VideoProject[] {
  return readState().projects;
}

export function getProject(projectId: string): VideoProject | undefined {
  return getProjects().find((project) => project.id === projectId);
}

export function saveProjects(projects: VideoProject[]): void {
  const state = readState();
  writeState({ ...state, projects });
}

export function saveProject(project: VideoProject): void {
  const projects = getProjects();
  const index = projects.findIndex((item) => item.id === project.id);
  const nextProjects = index === -1
    ? [...projects, project]
    : projects.map((item) => (item.id === project.id ? project : item));

  saveProjects(nextProjects);
}

export function deleteProject(projectId: string): void {
  saveProjects(getProjects().filter((project) => project.id !== projectId));
}
