import { create } from "zustand";

/**
 * Session-only YouTube cookies. Never written to localStorage/sessionStorage.
 * Cleared on full page reload by design.
 */
type YoutubeCookiesStore = {
  cookiesText: string | null;
  fileName: string | null;
  setCookies: (cookiesText: string, fileName: string) => void;
  clearCookies: () => void;
};

export const useYoutubeCookiesStore = create<YoutubeCookiesStore>((set) => ({
  cookiesText: null,
  fileName: null,
  setCookies: (cookiesText, fileName) => set({ cookiesText, fileName }),
  clearCookies: () => set({ cookiesText: null, fileName: null }),
}));
