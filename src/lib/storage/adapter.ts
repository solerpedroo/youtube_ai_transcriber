/** The only localStorage key owned by this application. */
export const STORAGE_KEY = "youtube-ai-transcriber";

export interface StorageAdapter {
  get<T>(key: string, fallback: T): T;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
}

/**
 * A browser-storage wrapper that is inert during SSR and when browser storage
 * is unavailable (for example private browsing with storage disabled).
 */
export class LocalStorageAdapter implements StorageAdapter {
  get<T>(key: string, fallback: T): T {
    if (typeof window === "undefined") return fallback;

    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) return fallback;
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }

  set<T>(key: string, value: T): void {
    if (typeof window === "undefined") return;

    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage quota and privacy-mode errors should not break the UI.
    }
  }

  remove(key: string): void {
    if (typeof window === "undefined") return;

    try {
      window.localStorage.removeItem(key);
    } catch {
      // Deliberately ignored: storage can be disabled by the browser.
    }
  }
}

export const storageAdapter = new LocalStorageAdapter();
