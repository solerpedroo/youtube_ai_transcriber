"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Clock3, Search, Trash2, Video } from "lucide-react";
import type { VideoProject } from "@/types";
import { formatTimestamp } from "@/lib/utils/time";
import { PhaseNotice } from "@/components/foundation/phase-notice";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProjectStore } from "@/stores/project-store";

function matchesQuery(project: VideoProject, query: string): boolean {
  const normalized = query.trim().toLocaleLowerCase();
  if (!normalized) return true;
  return [
    project.metadata.title,
    project.metadata.channel ?? "",
    project.transcript?.fullText ?? "",
  ].some((value) => value.toLocaleLowerCase().includes(normalized));
}

export function LibraryPageClient() {
  const hasHydrated = useProjectStore((state) => state.hasHydrated);
  const hydrate = useProjectStore((state) => state.hydrate);
  const projects = useProjectStore((state) => state.projects);
  const removeProject = useProjectStore((state) => state.removeProject);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!hasHydrated) hydrate();
  }, [hasHydrated, hydrate]);

  const filtered = useMemo(
    () => [...projects]
      .filter((project) => matchesQuery(project, query))
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
    [projects, query],
  );

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-violet-700 dark:text-violet-300">Seu espaço local</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">Biblioteca</h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Vídeos e transcrições salvos neste dispositivo.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-zinc-950 px-4 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-950"
          >
            Nova transcrição
          </Link>
        </div>

        <div className="mt-8 flex h-11 items-center gap-3 rounded-xl border border-zinc-200 bg-white px-3 dark:border-zinc-800 dark:bg-zinc-900">
          <Search className="size-4 text-zinc-400" />
          <Input
            aria-label="Pesquisar vídeos"
            placeholder="Pesquisar vídeos..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="h-auto border-0 bg-transparent px-0 shadow-none focus-visible:border-0 focus-visible:ring-0"
          />
        </div>

        {!hasHydrated ? (
          <p className="mt-6 text-sm text-zinc-500">Carregando biblioteca local...</p>
        ) : filtered.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-12">
            <span className="mx-auto grid size-12 place-items-center rounded-xl bg-zinc-100 text-zinc-500 dark:bg-zinc-800">
              <Video className="size-5" />
            </span>
            <h2 className="mt-4 text-lg font-semibold">
              {projects.length === 0 ? "Sua biblioteca está vazia" : "Nenhum resultado"}
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              {projects.length === 0
                ? "Quando você importar um vídeo, ele aparecerá aqui para consulta futura."
                : "Tente outro termo de busca."}
            </p>
            <div className="mt-5 inline-flex items-center gap-2 text-xs text-zinc-500">
              <Clock3 className="size-3.5" />Armazenado somente neste navegador
            </div>
          </div>
        ) : (
          <ul className="mt-6 grid gap-4">
            {filtered.map((project) => (
              <li
                key={project.id}
                className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:flex-row sm:items-center"
              >
                {project.metadata.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element -- remote YouTube thumbnails validated as HTTPS.
                  <img
                    src={project.metadata.thumbnail}
                    alt=""
                    className="aspect-video w-full rounded-lg object-cover sm:w-44"
                  />
                ) : (
                  <div className="grid aspect-video w-full place-items-center rounded-lg bg-zinc-100 text-zinc-400 dark:bg-zinc-800 sm:w-44">
                    <Video className="size-6" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-semibold">{project.metadata.title}</h2>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    {project.metadata.channel ?? "Canal não informado"} · {formatTimestamp(project.metadata.duration)}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {project.transcript ? "Com transcrição" : "Sem transcrição"} · atualizado {new Date(project.updatedAt).toLocaleString()}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button asChild size="sm">
                      <Link href={`/video/${project.id}`}>Abrir</Link>
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (window.confirm(`Excluir “${project.metadata.title}” deste navegador?`)) {
                          removeProject(project.id);
                        }
                      }}
                    >
                      <Trash2 className="size-4" />Excluir
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6">
          <PhaseNotice>
            A biblioteca lista, busca e exclui projetos salvos no localStorage deste navegador.
          </PhaseNotice>
        </div>
      </div>
    </AppShell>
  );
}
