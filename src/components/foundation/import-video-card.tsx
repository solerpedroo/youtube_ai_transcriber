"use client";
/* eslint-disable @next/next/no-img-element -- yt-dlp thumbnail hosts are dynamic; the API returns only validated HTTPS URLs. */

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ExternalLink, Info, Link2, LoaderCircle, Sparkles, X } from "lucide-react";
import type { Transcript, VideoMetadata } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProjectStore } from "@/stores/project-store";
import { useYoutubeCookiesStore } from "@/stores/youtube-cookies-store";

type ApiError = { code?: string; message?: string };

type SubtitlesResponse = {
  videoId: string;
  selected: { language: string; kind: "manual" | "auto" } | null;
  transcript: Pick<Transcript, "language" | "segments" | "fullText"> | null;
};

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);
  const remaining = Math.floor(seconds % 60);
  return [hours, minutes, remaining].filter((value, index) => index > 0 || value > 0).map((value) => String(value).padStart(2, "0")).join(":");
}

async function fetchExistingSubtitles(
  videoUrl: string,
  videoId: string,
  cookies?: string | null,
): Promise<Transcript | undefined> {
  try {
    const response = await fetch("/api/youtube/subtitles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: videoUrl,
        ...(cookies ? { cookies } : {}),
      }),
    });
    if (!response.ok) return undefined;
    const body = await response.json() as SubtitlesResponse;
    if (!body.transcript) return undefined;
    return {
      id: crypto.randomUUID(),
      videoId,
      language: body.transcript.language,
      segments: body.transcript.segments,
      fullText: body.transcript.fullText,
      createdAt: new Date().toISOString(),
    };
  } catch {
    return undefined;
  }
}

export function ImportVideoCard() {
  const router = useRouter();
  const addProject = useProjectStore((state) => state.addProject);
  const cookiesText = useYoutubeCookiesStore((state) => state.cookiesText);
  const [url, setUrl] = useState("");
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNeedsAuth(false);
    setMetadata(null);
    setIsLoading(true);
    try {
      const response = await fetch("/api/youtube/metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          ...(cookiesText ? { cookies: cookiesText } : {}),
        }),
      });
      const body = await response.json() as VideoMetadata | ApiError;
      if (!response.ok) {
        const code = "code" in body ? body.code : undefined;
        if (code === "VIDEO_PRIVATE" || code === "AUTH_REQUIRED") setNeedsAuth(true);
        throw new Error("message" in body && body.message ? body.message : "Não foi possível carregar o vídeo.");
      }
      setMetadata(body as VideoMetadata);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não foi possível carregar o vídeo.");
    } finally {
      setIsLoading(false);
    }
  }

  async function createProject() {
    if (!metadata || isCreating) return;
    setIsCreating(true);
    setError(null);
    try {
      const timestamp = new Date().toISOString();
      const id = crypto.randomUUID();
      const transcript = await fetchExistingSubtitles(metadata.url, metadata.videoId, cookiesText);
      addProject({
        id,
        metadata,
        transcript,
        conversations: [],
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      router.push(`/video/${id}`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não foi possível criar o projeto.");
      setIsCreating(false);
    }
  }

  return (
    <section className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-10 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="pointer-events-none absolute -right-20 -top-24 size-64 rounded-full bg-violet-200/50 blur-3xl dark:bg-violet-950/30" />
      <div className="relative mx-auto max-w-2xl">
        <div className="mb-6 flex size-11 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">
          <Sparkles className="size-5" />
        </div>
        <p className="text-sm font-medium text-violet-700 dark:text-violet-300">Transcreva. Pesquise. Entenda.</p>
        <h1 className="mt-2 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          Transforme vídeos do YouTube em conhecimento pesquisável.
        </h1>
        <p className="mt-4 max-w-xl text-pretty leading-7 text-zinc-600 dark:text-zinc-400">
          Cole o link de um vídeo para verificar suas informações antes de criar uma transcrição.
        </p>
        <form className="mt-8" onSubmit={handleSubmit}>
          <label className="sr-only" htmlFor="youtube-url">URL do vídeo do YouTube</label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex h-12 flex-1 items-center gap-3 rounded-xl border border-zinc-300 bg-zinc-50 px-4 shadow-inner shadow-zinc-100 focus-within:border-violet-500 focus-within:ring-4 focus-within:ring-violet-500/10 dark:border-zinc-700 dark:bg-zinc-950 dark:shadow-none">
              <Link2 className="size-4 shrink-0 text-zinc-400" />
              <Input
                id="youtube-url"
                required
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                type="url"
                placeholder="Cole uma URL do YouTube"
                className="h-auto min-w-0 flex-1 border-0 bg-transparent px-0 shadow-none focus-visible:border-0 focus-visible:ring-0"
              />
            </div>
            <Button type="submit" size="lg" className="h-12 rounded-xl px-5" disabled={isLoading || isCreating}>
              {isLoading ? <><LoaderCircle className="size-4 animate-spin" />Carregando</> : <>Importar vídeo <ArrowRight className="size-4" /></>}
            </Button>
          </div>
        </form>
        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-950 dark:bg-red-950/30 dark:text-red-300" role="alert">
            <p>{error}</p>
            {needsAuth && (
              <p className="mt-2 text-red-600 dark:text-red-200">
                Se você tem acesso legítimo, envie um cookies.txt em{" "}
                <Link href="/settings" className="underline">Configurações → Acesso ao YouTube</Link>
                {" "}e tente novamente.
              </p>
            )}
          </div>
        )}
        {metadata && (
          <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex flex-col gap-4 p-4 sm:flex-row">
              {metadata.thumbnail && (
                <img src={metadata.thumbnail} alt="Miniatura do vídeo" className="aspect-video w-full rounded-lg object-cover sm:w-44" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Vídeo encontrado</p>
                <h2 className="mt-1 truncate font-semibold">{metadata.title}</h2>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {metadata.channel ?? "Canal não informado"} · {formatDuration(metadata.duration)}
                </p>
                <a
                  className="mt-3 inline-flex items-center gap-1 text-xs text-violet-700 hover:underline dark:text-violet-300"
                  href={metadata.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  Abrir no YouTube <ExternalLink className="size-3" />
                </a>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-zinc-200 p-3 dark:border-zinc-800">
              <Button type="button" variant="ghost" disabled={isCreating} onClick={() => setMetadata(null)}>
                <X className="size-4" />Cancelar
              </Button>
              <Button type="button" disabled={isCreating} onClick={() => void createProject()}>
                {isCreating ? <><LoaderCircle className="size-4 animate-spin" />Buscando legendas</> : <>Criar projeto <ArrowRight className="size-4" /></>}
              </Button>
            </div>
          </div>
        )}
        <div className="mt-5 flex items-start gap-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
          <Info className="mt-0.5 size-3.5 shrink-0" />
          <p>
            Ao criar o projeto, legendas manuais ou automáticas existentes são preferidas antes da transcrição por áudio nas próximas fases.
          </p>
        </div>
      </div>
    </section>
  );
}
