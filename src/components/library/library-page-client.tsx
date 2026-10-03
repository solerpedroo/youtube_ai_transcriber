"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Clock3, Search, Trash2, Video } from "lucide-react";
import type { VideoProject } from "@/types";
import { formatTimestamp } from "@/lib/utils/time";
import { PhaseNotice } from "@/components/foundation/phase-notice";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
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
      <PageHeader
        label="Seu espaço local"
        title="Biblioteca"
        description="Vídeos e transcrições salvos neste dispositivo."
        actions={(
          <Button asChild variant="brand">
            <Link href="/">Nova transcrição</Link>
          </Button>
        )}
      />

      <div className="surface-card surface-in flex h-11 items-center gap-3 px-3">
        <Search className="size-4 text-muted-foreground" />
        <Input
          aria-label="Pesquisar vídeos"
          placeholder="Pesquisar vídeos..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="h-auto border-0 bg-transparent px-0 shadow-none focus-visible:border-0 focus-visible:ring-0"
        />
      </div>

      {!hasHydrated ? (
        <p className="mt-6 text-sm text-muted-foreground">Carregando biblioteca local...</p>
      ) : filtered.length === 0 ? (
        <div className="surface-card mt-6 p-8 text-center sm:p-12">
          <span className="icon-tile mx-auto grid size-12 place-items-center rounded-xl">
            <Video className="size-5 text-brand" />
          </span>
          <h2 className="mt-4 text-lg font-semibold">
            {projects.length === 0 ? "Sua biblioteca está vazia" : "Nenhum resultado"}
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
            {projects.length === 0
              ? "Quando você importar um vídeo, ele aparecerá aqui para consulta futura."
              : "Tente outro termo de busca."}
          </p>
          <div className="mt-5 inline-flex items-center gap-2 text-xs text-muted-foreground">
            <Clock3 className="size-3.5" />Armazenado somente neste navegador
          </div>
        </div>
      ) : (
        <ul className="mt-6 grid gap-4">
          {filtered.map((project) => (
            <li
              key={project.id}
              className="surface-interactive flex flex-col gap-4 p-4 sm:flex-row sm:items-center"
            >
              {project.metadata.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element -- remote YouTube thumbnails validated as HTTPS.
                <img
                  src={project.metadata.thumbnail}
                  alt=""
                  className="aspect-video w-full rounded-lg object-cover sm:w-44"
                />
              ) : (
                <div className="grid aspect-video w-full place-items-center rounded-lg bg-muted text-muted-foreground sm:w-44">
                  <Video className="size-6" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h2 className="truncate font-semibold">{project.metadata.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {project.metadata.channel ?? "Canal não informado"} · {formatTimestamp(project.metadata.duration)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {project.transcript ? "Com transcrição" : "Sem transcrição"} · atualizado {new Date(project.updatedAt).toLocaleString()}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button asChild size="sm" variant="brand">
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
          Biblioteca local com busca, estados vazios e exclusão — dados só neste navegador.
        </PhaseNotice>
      </div>
    </AppShell>
  );
}
