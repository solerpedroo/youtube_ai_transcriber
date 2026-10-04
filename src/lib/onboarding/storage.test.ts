import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearOnboardingCompleted,
  markOnboardingCompleted,
  ONBOARDING_STORAGE_KEY,
  readOnboardingCompleted,
} from "./storage";

const memoryStore: Record<string, string> = {};

function createMemoryStorage() {
  return {
    getItem(key: string) {
      return memoryStore[key] ?? null;
    },
    setItem(key: string, value: string) {
      memoryStore[key] = value;
    },
    removeItem(key: string) {
      delete memoryStore[key];
    },
  };
}

describe("onboarding storage", () => {
  beforeEach(() => {
    for (const key of Object.keys(memoryStore)) delete memoryStore[key];
    vi.stubGlobal("window", { localStorage: createMemoryStorage() });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("starts incomplete", () => {
    expect(readOnboardingCompleted()).toBe(false);
  });

  it("persists completion in localStorage", () => {
    markOnboardingCompleted();
    expect(readOnboardingCompleted()).toBe(true);
    expect(window.localStorage.getItem(ONBOARDING_STORAGE_KEY)).toContain("completedAt");
  });

  it("clears completion flag", () => {
    markOnboardingCompleted();
    clearOnboardingCompleted();
    expect(readOnboardingCompleted()).toBe(false);
  });
});
