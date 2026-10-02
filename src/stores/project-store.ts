import { create } from "zustand";
import type { Conversation, Transcript, VideoProject } from "@/types";
import * as projectStorage from "@/lib/storage/projects";

type ProjectStore = {
  projects: VideoProject[];
  hasHydrated: boolean;
  hydrate: () => void;
  addProject: (project: VideoProject) => void;
  updateProject: (projectId: string, changes: Partial<Omit<VideoProject, "id" | "createdAt">>) => void;
  removeProject: (projectId: string) => void;
  setTranscript: (projectId: string, transcript: Transcript) => void;
  saveConversation: (projectId: string, conversation: Conversation) => void;
};

function persist(projects: VideoProject[]): void {
  projectStorage.saveProjects(projects);
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: [],
  hasHydrated: false,
  hydrate: () => set({ projects: projectStorage.getProjects(), hasHydrated: true }),
  addProject: (project) => set((state) => {
    const projects = [...state.projects.filter((item) => item.id !== project.id), project];
    persist(projects);
    return { projects };
  }),
  updateProject: (projectId, changes) => set((state) => {
    const now = new Date().toISOString();
    const projects = state.projects.map((project) =>
      project.id === projectId ? { ...project, ...changes, id: project.id, createdAt: project.createdAt, updatedAt: now } : project,
    );
    persist(projects);
    return { projects };
  }),
  removeProject: (projectId) => set((state) => {
    const projects = state.projects.filter((project) => project.id !== projectId);
    persist(projects);
    return { projects };
  }),
  setTranscript: (projectId, transcript) => get().updateProject(projectId, { transcript }),
  saveConversation: (projectId, conversation) => set((state) => {
    const now = new Date().toISOString();
    const projects = state.projects.map((project) => {
      if (project.id !== projectId) return project;
      const conversations = [
        ...project.conversations.filter((item) => item.id !== conversation.id),
        conversation,
      ];
      return { ...project, conversations, updatedAt: now };
    });
    persist(projects);
    return { projects };
  }),
}));
