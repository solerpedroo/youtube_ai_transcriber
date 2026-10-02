"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, WandSparkles } from "lucide-react";
import type { Transcript, VideoProject } from "@/types";
import type { TranscriptionProgressEvent } from "@/lib/transcription/types";
import { ChatPanel } from "@/components/chat/chat-panel";
import { PhaseNotice } from "@/components/foundation/phase-notice";
import { AppShell } from "@/components/layout/app-shell";
import { TranscriptView } from "@/components/transcript/transcript-view";
import { Button } from "@/components/ui/button";
import { VideoHeader } from "@/components/video/video-header";
import { YoutubePlayer, type YoutubePlayerHandle } from "@/components/video/youtube-player";
import { useProjectStore } from "@/stores/project-store";
import { useSettingsStore } from "@/stores/settings-store";

type WorkspaceTab = "video" | "transcript" | "chat";

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
  const playerRef = useRef<YoutubePlayerHandle | null>(null);
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
  const [currentTime, setCurrentTime] = useState(0);
  const [tab, setTab] = useState<WorkspaceTab>("video");
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

  function seekTo(seconds: number) {
    const seeked = playerRef.current?.seekTo(seconds) ?? false;
    if (seeked) setCurrentTime(seconds);
    setTab("video");
  }

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
      setTab("transcript");
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

  const tabs: Array<{ id: WorkspaceTab; label: string }> = [
    { id: "video", label: "Vídeo" },
    { id: "transcript", label: "Transcrição" },
    { id: "chat", label: "Chat" },
  ];

  return (
    <AppShell compact>
      <VideoHeader
        metadata={project.metadata}
        statusLabel={project.transcript ? "Transcrição disponível" : "Sem transcrição"}
      />

      <div
        className="mb-4 flex gap-1 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-900 lg:hidden"
        role="tablist"
        aria-label="Seções do espaço de trabalho"
      >
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`workspace-tab-${item.id}`}
            aria-selected={tab === item.id}
            aria-controls={`workspace-panel-${item.id}`}
            tabIndex={tab === item.id ? 0 : -1}
            onClick={() => setTab(item.id)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
              tab === item.id
                ? "bg-white text-zinc-950 shadow-sm dark:bg-zinc-800 dark:text-white"
                : "text-zinc-500"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.85fr)_minmax(20rem,1fr)]">
        <section className={`overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 ${tab === "chat" ? "hidden lg:block" : ""}`}>
          <div
            id="workspace-panel-video"
            role="tabpanel"
            aria-labelledby="workspace-tab-video"
            className={tab === "transcript" ? "hidden lg:block" : ""}
          >
            <YoutubePlayer
              ref={playerRef}
              videoId={project.metadata.videoId}
              onTimeUpdate={setCurrentTime}
              className="overflow-hidden"
            />
          </div>

          <div
            id="workspace-panel-transcript"
            role="tabpanel"
            aria-labelledby="workspace-tab-transcript"
            className={`p-5 ${tab === "video" ? "hidden lg:block" : ""}`}
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-semibold">Transcrição</h2>
              <Button type="button" size="sm" disabled={isTranscribing} onClick={() => void startTranscription()}>
                {isTranscribing
                  ? <><LoaderCircle className="size-4 animate-spin" />Transcrevendo</>
                  : <><WandSparkles className="size-4" />{project.transcript ? "Nova transcrição IA" : "Transcrever com IA"}</>}
              </Button>
            </div>

            {progress && (
              <p className="mb-3 text-sm text-violet-700 dark:text-violet-300" aria-live="polite">{progress}</p>
            )}
            {error && (
              <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-950 dark:bg-red-950/30 dark:text-red-300" role="alert">
                {error}
              </p>
            )}

            {project.transcript ? (
              <div className="h-[28rem]">
                <TranscriptView
                  metadata={project.metadata}
                  transcript={project.transcript}
                  currentTime={currentTime}
                  onSeek={seekTo}
                />
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-zinc-300 p-5 text-sm leading-6 text-zinc-500 dark:border-zinc-700">
                Nenhuma transcrição ainda. Importe legendas na criação do projeto ou gere uma transcrição por IA.
              </div>
            )}
          </div>
        </section>

        <aside
          id="workspace-panel-chat"
          role="tabpanel"
          aria-labelledby="workspace-tab-chat"
          className={`rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 ${tab === "chat" ? "block" : "hidden lg:block"}`}
        >
          <ChatPanel key={project.id} project={project} />
        </aside>
      </div>

      <div className="mt-6">
        <PhaseNotice>
          Fase 6: chat com streaming via provedores de IA. A recuperação avançada por trechos chega na Fase 7.
        </PhaseNotice>
      </div>
    </AppShell>
  );
}
