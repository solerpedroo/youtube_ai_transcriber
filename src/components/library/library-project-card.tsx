"use client";

import Link from "next/link";
import { FileText, Play, Trash2, Video } from "lucide-react";
import type { VideoProject } from "@/types";
import { formatTimestamp } from "@/lib/utils/time";
import { Button } from "@/components/ui/button";
import { cn } from "cn";

type LibraryProjectCardProps = {
  project: VideoProject;
  onRemove: (id: string) => void;
};

export function LibraryProjectCard({ project, onRemove }: LibraryProjectCardProps) {
  const href = `/video/${project.id}`;
  const title = project.metadata.title;

  return (
    <li className="surface-card hover-lift surface-in group relative overflow-hidden">
      <Link
        href={href}
        className={cn(
          "absolute inset-0 z-0 rounded-[inherit]",
          "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        )}
        aria-label={`Abrir ${title}`}
      />
      <div className="pointer-events-none relative flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
        <div className="relative shrink-0 overflow-hidden rounded-lg sm:w-44">
          {project.metadata.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element -- miniatura remota validada como HTTPS.
            <img
              src={project.metadata.thumbnail}
              alt=""
              className="aspect-video w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="grid aspect-video w-full place-items-center bg-muted text-muted-foreground">
              <Video className="size-6" />
            </div>
          )}
          <span
            className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/25"
            aria-hidden
          >
            <span className="grid size-11 scale-90 place-items-center rounded-full bg-black/55 text-white opacity-0 shadow-lg transition-all group-hover:scale-100 group-hover:opacity-100">
              <Play className="size-5 fill-current" />
            </span>
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="truncate font-semibold transition-colors group-hover:text-brand">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {project.metadata.channel ?? "Canal não informado"} · {formatTimestamp(project.metadata.duration)}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
                project.transcript
                  ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {project.transcript && <FileText className="size-3" />}
              {project.transcript ? "Com transcrição" : "Sem transcrição"}
            </span>
            <span className="text-xs text-muted-foreground">
              Atualizado {new Date(project.updatedAt).toLocaleString()}
            </span>
          </div>
        </div>

        <div className="relative z-10 flex shrink-0 flex-wrap gap-2 sm:flex-col sm:items-stretch">
          <Button asChild size="sm" variant="brand" className="pointer-events-auto">
            <Link href={href}>Abrir</Link>
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="pointer-events-auto"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              if (window.confirm(`Excluir “${title}” deste navegador?`)) {
                onRemove(project.id);
              }
            }}
          >
            <Trash2 className="size-4" />
            Excluir
          </Button>
        </div>
      </div>
    </li>
  );
}
