"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Clock3, Search, Video } from "lucide-react";
import type { VideoProject } from "@/types";
import { AppNotice } from "@/components/foundation/app-notice";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { LibraryProjectCard } from "@/components/library/library-project-card";
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

      <div className="surface-card surface-in mt-2 flex h-11 items-center gap-3 px-3">
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
            <Video className="size-5 text-foreground/80" />
          </span>
          <h2 className="mt-4 text-lg font-semibold">
            {projects.length === 0 ? "Sua biblioteca está vazia" : "Nenhum resultado"}
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
            {projects.length === 0
              ? "Quando você importar um vídeo, ele aparecerá aqui para consulta futura."
              : "Tente outro termo de busca."}
          </p>
          <div className="mt-5 flex flex-col items-center gap-3">
            {projects.length === 0 && (
              <Button asChild variant="brand" size="sm">
                <Link href="/">Importar primeiro vídeo</Link>
              </Button>
            )}
            <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <Clock3 className="size-3.5" aria-hidden />
              Armazenado somente neste navegador
            </span>
          </div>
        </div>
      ) : (
        <ul className="mt-6 grid gap-4">
          {filtered.map((project) => (
            <LibraryProjectCard
              key={project.id}
              project={project}
              onRemove={removeProject}
            />
          ))}
        </ul>
      )}

      <div className="mt-6">
        <AppNotice>
          Projetos ficam só neste navegador. Clique em qualquer parte do card para abrir o workspace.
        </AppNotice>
      </div>
    </AppShell>
  );
}
