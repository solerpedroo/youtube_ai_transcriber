"use client";

import { useEffect } from "react";
import { FileText, FolderOpen, MessageSquareText } from "lucide-react";
import { ImportVideoCard } from "@/components/foundation/import-video-card";
import { PageHeader } from "@/components/layout/page-header";
import { QuickLinks } from "@/components/dashboard/quick-links";
import { StatCard } from "@/components/dashboard/stat-card";
import { useProjectStore } from "@/stores/project-store";

export function HomeOverview() {
  const hasHydrated = useProjectStore((state) => state.hasHydrated);
  const hydrate = useProjectStore((state) => state.hydrate);
  const projects = useProjectStore((state) => state.projects);

  useEffect(() => {
    if (!hasHydrated) hydrate();
  }, [hasHydrated, hydrate]);

  const withTranscript = projects.filter((project) => Boolean(project.transcript)).length;
  const withChat = projects.filter((project) => project.conversations.some((c) => c.messages.length > 0)).length;

  return (
    <div className="space-y-8">
      <PageHeader
        label="Workspace local"
        title="Transforme vídeos em conhecimento pesquisável"
        description="Importe um link, use legendas quando existirem e converse com a transcrição usando IA — tudo no seu navegador."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Projetos"
          value={hasHydrated ? projects.length : "—"}
          hint="Salvos neste dispositivo"
          icon={FolderOpen}
        />
        <StatCard
          label="Com transcrição"
          value={hasHydrated ? withTranscript : "—"}
          hint="Legendas ou áudio transcrito"
          icon={FileText}
          accent="success"
        />
        <StatCard
          label="Com chat"
          value={hasHydrated ? withChat : "—"}
          hint="Conversas iniciadas"
          icon={MessageSquareText}
          accent="muted"
        />
      </div>

      <QuickLinks />

      <ImportVideoCard />
    </div>
  );
}
