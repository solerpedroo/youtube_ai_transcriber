"use client";

import { useEffect } from "react";
import { applyResolvedTheme, resolveTheme } from "@/lib/theme/resolve-theme";
import { useSettingsStore } from "@/stores/settings-store";

/** Keeps the document `dark` class aligned with the persisted theme preference. */
export function ThemeSync() {
  const theme = useSettingsStore((state) => state.settings.theme);
  const hasHydrated = useSettingsStore((state) => state.hasHydrated);

  useEffect(() => {
    if (!hasHydrated) return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => {
      applyResolvedTheme(resolveTheme(theme, media.matches));
    };

    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, [hasHydrated, theme]);

  return null;
}
