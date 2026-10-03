"use client";

import type { ThemePreference } from "@/types";
import { useSettingsStore } from "@/stores/settings-store";

const OPTIONS: Array<{ id: ThemePreference; label: string; description: string; preview: string }> = [
  { id: "light", label: "Claro", description: "Sempre usa o tema claro.", preview: "bg-background border-border" },
  { id: "dark", label: "Escuro", description: "Sempre usa o tema escuro.", preview: "bg-foreground/90 border-border" },
  { id: "system", label: "Sistema", description: "Acompanha a preferência do sistema.", preview: "bg-gradient-to-r from-background to-foreground/80 border-border" },
];

export function AppearanceForm() {
  const theme = useSettingsStore((state) => state.settings.theme);
  const updateSettings = useSettingsStore((state) => state.updateSettings);
  const hasHydrated = useSettingsStore((state) => state.hasHydrated);

  if (!hasHydrated) {
    return <p className="text-sm text-muted-foreground">Carregando preferência de tema...</p>;
  }

  return (
    <fieldset className="space-y-3">
      <legend className="sr-only">Tema da interface</legend>
      <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Tema da interface">
        {OPTIONS.map((option) => {
          const selected = theme === option.id;
          return (
            <label
              key={option.id}
              className={`cursor-pointer rounded-xl border px-3 py-3 transition hover:shadow-sm ${
                selected
                  ? "border-brand bg-brand/10 ring-2 ring-brand/20"
                  : "border-border bg-card hover:border-brand/30"
              }`}
            >
              <div className={`mb-3 h-9 rounded-lg border ${option.preview}`} aria-hidden />
              <input
                type="radio"
                name="theme"
                value={option.id}
                checked={selected}
                onChange={() => updateSettings({ theme: option.id })}
                className="sr-only"
              />
              <span className="block text-sm font-medium">{option.label}</span>
              <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                {option.description}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
