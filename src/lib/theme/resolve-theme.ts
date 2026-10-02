import type { ThemePreference } from "@/types";

export type ResolvedTheme = "light" | "dark";

/** Resolves a stored preference against the current system color scheme. */
export function resolveTheme(
  preference: ThemePreference,
  systemPrefersDark: boolean,
): ResolvedTheme {
  if (preference === "light") return "light";
  if (preference === "dark") return "dark";
  return systemPrefersDark ? "dark" : "light";
}

/** Applies or removes the Tailwind `dark` class on the document element. */
export function applyResolvedTheme(theme: ResolvedTheme): void {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
}
