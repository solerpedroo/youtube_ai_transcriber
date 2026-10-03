"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { AIProviderId } from "@/types";
import { StatusMessage } from "@/components/foundation/status-message";
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

const PROVIDERS: Array<{
  id: AIProviderId;
  label: string;
  models: string[];
  needsBaseUrl?: boolean;
}> = [
  { id: "openai", label: "OpenAI", models: ["gpt-4.1-mini", "gpt-4.1", "gpt-4o-mini"] },
  { id: "anthropic", label: "Anthropic", models: ["claude-sonnet-4-5", "claude-haiku-4-5"] },
  { id: "gemini", label: "Google Gemini", models: ["gemini-2.5-flash", "gemini-2.5-pro"] },
  { id: "groq", label: "Groq", models: ["openai/gpt-oss-120b", "qwen/qwen3.6-27b"] },
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
  const [testStatus, setTestStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [testMessage, setTestMessage] = useState<string | null>(null);
  const testAbortRef = useRef<AbortController | null>(null);
  const current = settings.chatProvider;
  const providerMeta = PROVIDERS.find((item) => item.id === current.provider) ?? PROVIDERS[0]!;
  const modelOptions = providerMeta.models.includes(current.model)
    ? providerMeta.models
    : [current.model, ...providerMeta.models];
  const useCustomModelField = providerMeta.needsBaseUrl;

  useEffect(() => () => {
    testAbortRef.current?.abort();
  }, []);

  function readChatConfig(form: HTMLFormElement) {
    const data = new FormData(form);
    const apiKeyFromForm = String(data.get("apiKey") ?? "").trim();
    const baseUrlValue = String(data.get("baseUrl") ?? "").trim();
    return {
      provider: current.provider,
      model: current.model.trim(),
      apiKey: apiKeyFromForm || current.apiKey.trim(),
      baseUrl: current.provider === "openai-compatible" && baseUrlValue ? baseUrlValue : undefined,
    };
  }

  function cancelProviderTest() {
    testAbortRef.current?.abort();
    testAbortRef.current = null;
    setTestStatus("idle");
    setTestMessage(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateSettings({ chatProvider: readChatConfig(event.currentTarget) });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2_000);
  }

  async function testProvider(form: HTMLFormElement) {
    const config = readChatConfig(form);
    if (!config.apiKey.trim()) {
      setTestStatus("error");
      setTestMessage("Informe a chave de API antes de testar.");
      return;
    }
    if (!config.model.trim()) {
      setTestStatus("error");
      setTestMessage("Informe o modelo antes de testar.");
      return;
    }

    testAbortRef.current?.abort();
    const abortController = new AbortController();
    testAbortRef.current = abortController;

    setTestStatus("loading");
    setTestMessage(null);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortController.signal,
        body: JSON.stringify({
          ...config,
          videoTitle: "Teste de provedor",
          transcriptText: "Contexto curto para validar a conexão com o provedor de chat.",
          messages: [{ role: "user", content: "Responda apenas com a palavra ok." }],
        }),
      });

      if (!response.ok) {
        const body = await response.json() as { message?: string };
        throw new Error(body.message ?? "Não foi possível testar o provedor.");
      }
      if (!response.body) throw new Error("Resposta de teste sem corpo.");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let received = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line) as { type: string; message?: string };
          if (event.type === "delta") received = true;
          if (event.type === "error") throw new Error(event.message ?? "Falha no provedor.");
        }
      }

      if (abortController.signal.aborted) return;
      if (!received) throw new Error("O provedor não retornou conteúdo.");
      updateSettings({ chatProvider: config });
      setTestStatus("success");
      setTestMessage("Conexão com o provedor confirmada.");
    } catch (error) {
      if (abortController.signal.aborted) return;
      setTestStatus("error");
      setTestMessage(error instanceof Error ? error.message : "Não foi possível testar o provedor.");
    } finally {
      if (testAbortRef.current === abortController) testAbortRef.current = null;
    }
  }

  if (!hasHydrated) {
    return <p className="text-sm text-muted-foreground">Carregando preferências locais...</p>;
  }

  return (
    <form
      className="space-y-4"
      onSubmit={handleSubmit}
      onKeyDown={(event) => {
        if (event.key === "Escape") cancelProviderTest();
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <SettingsField label="Provedor">
          <Select
            value={current.provider}
            onValueChange={(value) => {
              const provider = value as AIProviderId;
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
          {useCustomModelField ? (
            <Input
              value={current.model}
              onChange={(event) => updateSettings({
                chatProvider: { ...current, model: event.target.value },
              })}
              placeholder="ID do modelo"
            />
          ) : (
            <Select
              value={current.model}
              onValueChange={(model) => updateSettings({
                chatProvider: { ...current, model },
              })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Escolha o modelo" />
              </SelectTrigger>
              <SelectContent>
                {modelOptions.map((model) => (
                  <SelectItem key={model} value={model}>
                    {model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </SettingsField>
      </div>

      {providerMeta.needsBaseUrl && (
        <SettingsField label="Base URL">
          <Input
            name="baseUrl"
            type="url"
            value={current.baseUrl ?? ""}
            onChange={(event) => updateSettings({
              chatProvider: { ...current, baseUrl: event.target.value },
            })}
            placeholder="https://exemplo.com/v1"
          />
        </SettingsField>
      )}

      <SettingsField label="Chave de API">
        <Input
          name="apiKey"
          type="password"
          autoComplete="off"
          value={current.apiKey}
          onChange={(event) => updateSettings({
            chatProvider: { ...current, apiKey: event.target.value },
          })}
          placeholder="Armazenada apenas neste navegador"
        />
      </SettingsField>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit">Salvar chat</Button>
        <Button
          type="button"
          variant="outline"
          disabled={testStatus === "loading"}
          onClick={(event) => {
            const form = event.currentTarget.form;
            if (form) void testProvider(form);
          }}
        >
          {testStatus === "loading" ? "Testando..." : "Testar provedor"}
        </Button>
        {saved && <p className="text-sm text-emerald-700 dark:text-emerald-300">Preferências salvas localmente.</p>}
      </div>

      {testStatus === "loading" && (
        <StatusMessage tone="loading">Enviando uma pergunta curta ao provedor...</StatusMessage>
      )}
      {testStatus === "success" && testMessage && (
        <StatusMessage tone="success">{testMessage}</StatusMessage>
      )}
      {testStatus === "error" && testMessage && (
        <StatusMessage tone="error">{testMessage}</StatusMessage>
      )}
    </form>
  );
}
