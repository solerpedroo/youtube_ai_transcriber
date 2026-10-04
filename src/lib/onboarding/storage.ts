export const ONBOARDING_STORAGE_KEY = "youtube-ai-transcriber-onboarding";
export const ONBOARDING_VERSION = 1;

export type OnboardingPersistedState = {
  version: number;
  completedAt: string;
};

export function readOnboardingCompleted(): boolean {
  if (typeof window === "undefined") return false;

  try {
    const raw = window.localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as Partial<OnboardingPersistedState>;
    return parsed.version === ONBOARDING_VERSION && typeof parsed.completedAt === "string";
  } catch {
    return false;
  }
}

export function markOnboardingCompleted(): void {
  if (typeof window === "undefined") return;

  const payload: OnboardingPersistedState = {
    version: ONBOARDING_VERSION,
    completedAt: new Date().toISOString(),
  };
  try {
    window.localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Storage disabled — tour may reappear; acceptable edge case.
  }
}

export function clearOnboardingCompleted(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(ONBOARDING_STORAGE_KEY);
  } catch {
    // ignored
  }
}
