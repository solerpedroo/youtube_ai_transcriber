"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Mic } from "lucide-react";
import type { Transcript, VideoProject } from "@/types";
import type { TranscriptionProgressEvent } from "@/lib/transcription/types";
import { ChatPanel } from "@/components/chat/chat-panel";
import { StatusMessage } from "@/components/foundation/status-message";
import { AppShell } from "@/components/layout/app-shell";
import { WorkspaceTabs } from "@/components/layout/workspace-tabs";
import { TranscriptView } from "@/components/transcript/transcript-view";
import { Button } from "@/components/ui/button";
import { VideoHeader } from "@/components/video/video-header";
import { YoutubePlayer, type YoutubePlayerHandle } from "@/components/video/youtube-player";
import { useProjectStore } from "@/stores/project-store";
import { useSettingsStore } from "@/stores/settings-store";
import { useYoutubeCookiesStore } from "@/stores/youtube-cookies-store";

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
  const cookiesText = useYoutubeCookiesStore((state) => state.cookiesText);

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
          ...(cookiesText ? { cookies: cookiesText } : {}),
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
        <p className="text-sm text-muted-foreground">Carregando projeto local...</p>
      </AppShell>
    );
  }

  if (!project) {
    return (
      <AppShell compact>
        <div className="surface-card mx-auto max-w-lg p-6">
          <h1 className="text-xl font-semibold">Projeto não encontrado</h1>
          <p className="mt-2 text-sm text-muted-foreground">
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

      <WorkspaceTabs
        className="mb-4 lg:hidden"
        tabs={tabs}
        active={tab}
        onChange={setTab}
        onKeyDown={(event) => {
          if (event.key !== "ArrowRight" && event.key !== "ArrowLeft" && event.key !== "Home" && event.key !== "End") {
            return;
          }
          event.preventDefault();
          const currentIndex = tabs.findIndex((item) => item.id === tab);
          let nextIndex = currentIndex;
          if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % tabs.length;
          if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
          if (event.key === "Home") nextIndex = 0;
          if (event.key === "End") nextIndex = tabs.length - 1;
          const next = tabs[nextIndex];
          if (!next) return;
          setTab(next.id);
          document.getElementById(`workspace-tab-${next.id}`)?.focus();
        }}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.85fr)_minmax(20rem,1fr)]">
        <section className={`surface-card surface-in overflow-hidden ${tab === "chat" ? "hidden lg:block" : ""}`}>
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
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
              <div>
                <p className="label-caps">Texto do vídeo</p>
                <h2 className="font-semibold">Transcrição</h2>
              </div>
              <Button type="button" size="sm" variant="brand" disabled={isTranscribing} onClick={() => void startTranscription()}>
                {isTranscribing
                  ? <><LoaderCircle className="size-4 animate-spin" />Transcrevendo</>
                  : <><Mic className="size-4" />{project.transcript ? "Transcrever de novo" : "Transcrever áudio"}</>}
              </Button>
            </div>

            {progress && (
              <StatusMessage tone="loading" className="mb-3">{progress}</StatusMessage>
            )}
            {error && (
              <StatusMessage tone="error" className="mb-3">{error}</StatusMessage>
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
              <div className="rounded-xl border border-dashed border-border p-5 text-sm leading-6 text-muted-foreground">
                Nenhuma transcrição ainda. Importe legendas na criação do projeto ou gere uma transcrição por IA.
              </div>
            )}
          </div>
        </section>

        <aside
          id="workspace-panel-chat"
          role="tabpanel"
          aria-labelledby="workspace-tab-chat"
          className={`surface-card surface-in flex min-h-[28rem] max-h-[calc(100dvh-11rem)] flex-col overflow-hidden p-5 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] ${tab === "chat" ? "flex" : "hidden lg:flex"}`}
        >
          <ChatPanel key={project.id} project={project} onSeek={seekTo} />
        </aside>
      </div>

    </AppShell>
  );
}
