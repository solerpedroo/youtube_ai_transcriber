"use client";

import { useState, type FormEvent } from "react";
import type { AIProviderId } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSettingsStore } from "@/stores/settings-store";

const PROVIDERS: Array<{
  id: AIProviderId;
  label: string;
  models: string[];
  needsBaseUrl?: boolean;
}> = [
  { id: "openai", label: "OpenAI", models: ["gpt-4.1-mini", "gpt-4.1", "gpt-4o-mini"] },
  { id: "anthropic", label: "Anthropic", models: ["claude-sonnet-4-5", "claude-haiku-4-5"] },
  { id: "gemini", label: "Google Gemini", models: ["gemini-2.5-flash", "gemini-2.5-pro"] },
  { id: "groq", label: "Groq", models: ["llama-3.3-70b-versatile", "openai/gpt-oss-120b"] },
  {
    id: "openai-compatible",
    label: "OpenAI-compatible",
    models: ["custom-model"],
    needsBaseUrl: true,
  },
];

export function ChatSettingsForm() {
  const settings = useSettingsStore((state) => state.settings);
  const updateSettings = useSettingsStore((state) => state.updateSettings);
  const hasHydrated = useSettingsStore((state) => state.hasHydrated);
  const [saved, setSaved] = useState(false);
  const current = settings.chatProvider;
  const providerMeta = PROVIDERS.find((item) => item.id === current.provider) ?? PROVIDERS[0]!;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const provider = String(form.get("provider") ?? "openai") as AIProviderId;
    const model = String(form.get("model") ?? "").trim();
    const apiKey = String(form.get("apiKey") ?? "");
    const baseUrlValue = String(form.get("baseUrl") ?? "").trim();
    updateSettings({
      chatProvider: {
        provider,
        model,
        apiKey,
        baseUrl: provider === "openai-compatible" && baseUrlValue ? baseUrlValue : undefined,
      },
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
            value={current.provider}
            className="h-10 rounded-lg border border-zinc-300 bg-white px-3 dark:border-zinc-700 dark:bg-zinc-950"
            onChange={(event) => {
              const provider = event.target.value as AIProviderId;
              const meta = PROVIDERS.find((item) => item.id === provider) ?? PROVIDERS[0]!;
              updateSettings({
                chatProvider: {
                  provider,
                  apiKey: current.apiKey,
                  model: meta.models[0] ?? current.model,
                  baseUrl: meta.needsBaseUrl ? current.baseUrl : undefined,
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
          <Input
            name="model"
            value={current.model}
            onChange={(event) => updateSettings({
              chatProvider: { ...current, model: event.target.value },
            })}
            list="chat-model-suggestions"
            placeholder="ID do modelo"
          />
          <datalist id="chat-model-suggestions">
            {providerMeta.models.map((model) => (
              <option key={model} value={model} />
            ))}
          </datalist>
        </label>
      </div>

      {providerMeta.needsBaseUrl && (
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">Base URL</span>
          <Input
            name="baseUrl"
            type="url"
            value={current.baseUrl ?? ""}
            onChange={(event) => updateSettings({
              chatProvider: { ...current, baseUrl: event.target.value },
            })}
            placeholder="https://exemplo.com/v1"
          />
        </label>
      )}

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
        <Button type="submit">Salvar chat</Button>
        {saved && <p className="text-sm text-emerald-700 dark:text-emerald-300">Preferências salvas localmente.</p>}
      </div>
    </form>
  );
}
