import type { VideoProject } from "@/types";
import { STORAGE_KEY, storageAdapter } from "./adapter";
import { createDefaultAppState, migrateAppState, type PersistedAppState } from "./migrations";

function readState(): PersistedAppState {
  return migrateAppState(storageAdapter.get<unknown>(STORAGE_KEY, createDefaultAppState()));
}

function writeState(nextState: PersistedAppState): void {
  storageAdapter.set(STORAGE_KEY, nextState);
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
