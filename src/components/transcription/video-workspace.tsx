"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  LoaderCircle,
  MessageSquareText,
  Search,
  Subtitles,
  Video,
  WandSparkles,
} from "lucide-react";
import type { Transcript, VideoProject } from "@/types";
import type { TranscriptionProgressEvent } from "@/lib/transcription/types";
import { PhaseNotice } from "@/components/foundation/phase-notice";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { useProjectStore } from "@/stores/project-store";
import { useSettingsStore } from "@/stores/settings-store";

function formatTimestamp(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(total / 3_600);
  const minutes = Math.floor((total % 3_600) / 60);
  const remaining = total % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`;
  }
  return `${minutes}:${String(remaining).padStart(2, "0")}`;
}

async function consumeTranscriptionStream(
  response: Response,
  onEvent: (event: TranscriptionProgressEvent) => void,
): Promise<Extract<TranscriptionProgressEvent, { type: "complete" }>["transcript"]> {
  if (!response.body) throw new Error("Resposta de transcrição sem corpo.");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let complete: Extract<TranscriptionProgressEvent, { type: "complete" }>["transcript"] | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.trim()) continue;
      const event = JSON.parse(line) as TranscriptionProgressEvent;
      onEvent(event);
      if (event.type === "complete") complete = event.transcript;
      if (event.type === "error") throw new Error(event.message);
    }
  }

  if (!complete) throw new Error("A transcrição terminou sem resultado.");
  return complete;
}

export function VideoWorkspace({ projectId }: { projectId: string }) {
  const router = useRouter();
  const hasHydratedProjects = useProjectStore((state) => state.hasHydrated);
  const hydrateProjects = useProjectStore((state) => state.hydrate);
  const projects = useProjectStore((state) => state.projects);
  const setTranscript = useProjectStore((state) => state.setTranscript);

  const hasHydratedSettings = useSettingsStore((state) => state.hasHydrated);
  const hydrateSettings = useSettingsStore((state) => state.hydrate);
  const transcriptionProvider = useSettingsStore((state) => state.settings.transcriptionProvider);

  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!hasHydratedProjects) hydrateProjects();
    if (!hasHydratedSettings) hydrateSettings();
  }, [hasHydratedProjects, hasHydratedSettings, hydrateProjects, hydrateSettings]);

  useEffect(() => () => {
    abortRef.current?.abort();
  }, []);

  const project = useMemo(
    () => projects.find((item) => item.id === projectId) as VideoProject | undefined,
    [projectId, projects],
  );

  async function startTranscription() {
    if (!project || isTranscribing) return;
    if (!transcriptionProvider.apiKey.trim()) {
      setError("Configure a chave de API de transcrição em Configurações.");
      return;
    }

    abortRef.current?.abort();
    const abortController = new AbortController();
    abortRef.current = abortController;

    setIsTranscribing(true);
    setError(null);
    setProgress("Preparando transcrição...");

    try {
      const response = await fetch("/api/transcription/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortController.signal,
        body: JSON.stringify({
          url: project.metadata.url,
          provider: transcriptionProvider.provider,
          apiKey: transcriptionProvider.apiKey,
          model: transcriptionProvider.model,
        }),
      });

      if (!response.ok) {
        const body = await response.json() as { message?: string };
        throw new Error(body.message ?? "Não foi possível iniciar a transcrição.");
      }

      const completePayload = await consumeTranscriptionStream(response, (event) => {
        if (event.type === "status") setProgress(event.message ?? event.status);
      });

      const transcript: Transcript = {
        id: crypto.randomUUID(),
        videoId: project.metadata.videoId,
        language: completePayload.language,
        segments: completePayload.segments,
        fullText: completePayload.fullText,
        createdAt: new Date().toISOString(),
      };
      setTranscript(project.id, transcript);
      setProgress("Transcrição concluída.");
    } catch (requestError) {
      if (abortController.signal.aborted) {
        setProgress(null);
        return;
      }
      setError(requestError instanceof Error ? requestError.message : "Não foi possível transcrever o vídeo.");
      setProgress(null);
    } finally {
      if (abortRef.current === abortController) abortRef.current = null;
      setIsTranscribing(false);
    }
  }

  if (!hasHydratedProjects || !hasHydratedSettings) {
    return (
      <AppShell compact>
        <p className="text-sm text-zinc-500">Carregando projeto local...</p>
      </AppShell>
    );
  }

  if (!project) {
    return (
      <AppShell compact>
        <div className="mx-auto max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h1 className="text-xl font-semibold">Projeto não encontrado</h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Este projeto não existe neste navegador.
          </p>
          <Button className="mt-4" onClick={() => router.push("/")}>Voltar ao início</Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell compact>
      <div className="mb-6">
        <Link href="/library" className="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white">
          <ArrowLeft className="size-4" />Biblioteca
        </Link>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Espaço de trabalho</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">{project.metadata.title}</h1>
            <p className="mt-1 text-sm text-zinc-500">{project.metadata.channel ?? "Canal não informado"}</p>
          </div>
          <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-medium text-violet-800 dark:bg-violet-950/50 dark:text-violet-300">
            {project.transcript ? "Transcrição disponível" : "Sem transcrição"}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.85fr)_minmax(20rem,1fr)]">
        <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="grid aspect-video place-items-center bg-zinc-950 text-center text-zinc-400">
            <div>
              <Video className="mx-auto size-8 text-zinc-600" />
              <p className="mt-3 text-sm">O player do YouTube chega na Fase 5.</p>
            </div>
          </div>
          <div className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold">Transcrição</h2>
                <Search className="size-4 text-zinc-400" />
              </div>
              <Button type="button" size="sm" disabled={isTranscribing} onClick={() => void startTranscription()}>
                {isTranscribing
                  ? <><LoaderCircle className="size-4 animate-spin" />Transcrevendo</>
                  : <><WandSparkles className="size-4" />{project.transcript ? "Nova transcrição IA" : "Transcrever com IA"}</>}
              </Button>
            </div>

            {progress && (
              <p className="mt-3 text-sm text-violet-700 dark:text-violet-300" aria-live="polite">{progress}</p>
            )}
            {error && (
              <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-950 dark:bg-red-950/30 dark:text-red-300" role="alert">
                {error}
              </p>
            )}

            {project.transcript ? (
              <div className="mt-4 max-h-[28rem] space-y-3 overflow-y-auto pr-1">
                {project.transcript.segments.map((segment) => (
                  <div key={segment.id} className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-3 text-sm">
                    <span className="font-mono text-xs text-zinc-500">{formatTimestamp(segment.start)}</span>
                    <p className="leading-6 text-zinc-700 dark:text-zinc-300">{segment.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-dashed border-zinc-300 p-5 text-sm leading-6 text-zinc-500 dark:border-zinc-700">
                Nenhuma transcrição ainda. Se o vídeo tiver legendas, elas podem ter sido importadas na criação do projeto; caso contrário, use a transcrição por IA.
              </div>
            )}
          </div>
        </section>

        <aside className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-2">
            <MessageSquareText className="size-4 text-violet-600 dark:text-violet-400" />
            <h2 className="font-semibold">Assistente de IA</h2>
          </div>
          <div className="mt-5 flex min-h-72 flex-col items-center justify-center text-center">
            <span className="grid size-10 place-items-center rounded-xl bg-zinc-100 text-zinc-500 dark:bg-zinc-800">
              <Subtitles className="size-5" />
            </span>
            <p className="mt-4 text-sm font-medium">Pergunte qualquer coisa sobre este vídeo.</p>
            <p className="mt-2 text-sm leading-6 text-zinc-500">
              O chat será liberado na Fase 6, após a transcrição e um provedor de chat.
            </p>
          </div>
        </aside>
      </div>

      <div className="mt-6">
        <PhaseNotice>
          Fase 4 habilita a pipeline de transcrição. Player, busca avançada e chat chegam nas próximas fases.
        </PhaseNotice>
      </div>
    </AppShell>
  );
}
