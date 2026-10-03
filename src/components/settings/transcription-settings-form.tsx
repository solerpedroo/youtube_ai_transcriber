"use client";

import { useState, type FormEvent } from "react";
import type { TranscriptionProviderId } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SettingsField } from "@/components/settings/settings-field";
import { useSettingsStore } from "@/stores/settings-store";

const PROVIDERS: Array<{ id: TranscriptionProviderId; label: string; models: string[] }> = [
  { id: "groq", label: "Groq", models: ["whisper-large-v3-turbo", "whisper-large-v3"] },
  // Only models that support verbose_json + segment timestamps in the current adapter.
  { id: "openai", label: "OpenAI", models: ["whisper-1"] },
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
    const apiKey = String(form.get("apiKey") ?? "");
    updateSettings({
      transcriptionProvider: {
        provider: current.provider,
        model: current.model,
        apiKey,
      },
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2_000);
  }

  if (!hasHydrated) {
    return <p className="text-sm text-muted-foreground">Carregando preferências locais...</p>;
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <SettingsField label="Provedor">
          <Select
            value={current.provider}
            onValueChange={(value) => {
              const provider = value as TranscriptionProviderId;
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
            <SelectTrigger>
              <SelectValue placeholder="Escolha o provedor" />
            </SelectTrigger>
            <SelectContent>
              {PROVIDERS.map((provider) => (
                <SelectItem key={provider.id} value={provider.id}>
                  {provider.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingsField>
        <SettingsField label="Modelo">
          <Select
            value={current.model}
            onValueChange={(model) => updateSettings({
              transcriptionProvider: { ...current, model },
            })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Escolha o modelo" />
            </SelectTrigger>
            <SelectContent>
              {providerMeta.models.map((model) => (
                <SelectItem key={model} value={model}>
                  {model}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingsField>
      </div>
      <SettingsField label="Chave de API">
        <Input
          name="apiKey"
          type="password"
          autoComplete="off"
          defaultValue={current.apiKey}
          placeholder="Armazenada apenas neste navegador"
        />
      </SettingsField>
      <div className="flex items-center gap-3">
        <Button type="submit">Salvar transcrição</Button>
        {saved && <p className="text-sm text-emerald-700 dark:text-emerald-300">Preferências salvas localmente.</p>}
      </div>
    </form>
  );
}
