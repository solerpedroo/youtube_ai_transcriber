"use client";

import { useEffect } from "react";
import { useProjectStore } from "@/stores/project-store";

export function SidebarStats() {
  const hasHydrated = useProjectStore((state) => state.hasHydrated);
  const hydrate = useProjectStore((state) => state.hydrate);
  const count = useProjectStore((state) => state.projects.length);

  useEffect(() => {
    if (!hasHydrated) hydrate();
  }, [hasHydrated, hydrate]);

  return (
    <div className="surface-inset rounded-xl p-3">
      <p className="sidebar-section-label pb-1">Resumo local</p>
      <p className="text-2xl font-semibold tabular-nums tracking-tight">
        {hasHydrated ? count : "—"}
      </p>
      <p className="text-xs text-muted-foreground">projetos neste navegador</p>
    </div>
  );
}
