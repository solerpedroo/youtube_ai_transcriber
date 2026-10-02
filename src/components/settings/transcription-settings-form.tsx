"use client";

import { useState, type FormEvent } from "react";
import type { TranscriptionProviderId } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSettingsStore } from "@/stores/settings-store";

const PROVIDERS: Array<{ id: TranscriptionProviderId; label: string; models: string[] }> = [
  { id: "groq", label: "Groq", models: ["whisper-large-v3-turbo", "whisper-large-v3"] },
  { id: "openai", label: "OpenAI", models: ["whisper-1", "gpt-4o-mini-transcribe", "gpt-4o-transcribe"] },
];

export function TranscriptionSettingsForm() {
  const settings = useSettingsStore((state) => state.settings);
  const updateSettings = useSettingsStore((state) => state.updateSettings);
  const hasHydrated = useSettingsStore((state) => state.hasHydrated);
  const [saved, setSaved] = useState(false);

  const current = settings.transcriptionProvider;
  const providerMeta = PROVIDERS.find((item) => item.id === current.provider) ?? PROVIDERS[0]!;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const provider = String(form.get("provider") ?? "groq") as TranscriptionProviderId;
    const model = String(form.get("model") ?? "").trim();
    const apiKey = String(form.get("apiKey") ?? "");
    updateSettings({
      transcriptionProvider: { provider, model, apiKey },
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2_000);
  }

  if (!hasHydrated) {
    return <p className="text-sm text-zinc-500">Carregando preferências locais...</p>;
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">Provedor</span>
          <select
            name="provider"
            defaultValue={current.provider}
            className="h-10 rounded-lg border border-zinc-300 bg-white px-3 dark:border-zinc-700 dark:bg-zinc-950"
            onChange={(event) => {
              const provider = event.target.value as TranscriptionProviderId;
              const models = PROVIDERS.find((item) => item.id === provider)?.models ?? [];
              updateSettings({
                transcriptionProvider: {
                  provider,
                  apiKey: current.apiKey,
                  model: models[0] ?? current.model,
                },
              });
            }}
          >
            {PROVIDERS.map((provider) => (
              <option key={provider.id} value={provider.id}>{provider.label}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">Modelo</span>
          <select
            name="model"
            value={current.model}
            onChange={(event) => updateSettings({
              transcriptionProvider: { ...current, model: event.target.value },
            })}
            className="h-10 rounded-lg border border-zinc-300 bg-white px-3 dark:border-zinc-700 dark:bg-zinc-950"
          >
            {providerMeta.models.map((model) => (
              <option key={model} value={model}>{model}</option>
            ))}
          </select>
        </label>
      </div>
      <label className="grid gap-1.5 text-sm">
        <span className="font-medium">Chave de API</span>
        <Input
          name="apiKey"
          type="password"
          autoComplete="off"
          defaultValue={current.apiKey}
          placeholder="Armazenada apenas neste navegador"
        />
      </label>
      <div className="flex items-center gap-3">
        <Button type="submit">Salvar transcrição</Button>
        {saved && <p className="text-sm text-emerald-700 dark:text-emerald-300">Preferências salvas localmente.</p>}
      </div>
    </form>
  );
}
