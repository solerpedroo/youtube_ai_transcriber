"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";

const TITLES: Record<string, { title: string; subtitle?: string }> = {
  "/": { title: "Importar", subtitle: "Cole um link do YouTube" },
  "/library": { title: "Biblioteca", subtitle: "Projetos locais" },
  "/settings": { title: "Configurações", subtitle: "Provedores e acesso" },
};

function resolveTitle(pathname: string) {
  if (pathname.startsWith("/video/")) {
    return { title: "Workspace", subtitle: "Vídeo e transcrição" };
  }
  return TITLES[pathname] ?? { title: "YouTube AI", subtitle: "Transcriber" };
}

export function MobileTopBar() {
  const pathname = usePathname();
  const copy = resolveTitle(pathname);

  return (
    <header className="glass sticky top-0 z-30 border-b border-border/70 lg:hidden">
      <div className="flex h-14 items-center gap-3 px-4">
        <Link href="/" className="icon-tile grid size-9 shrink-0 place-items-center rounded-xl" aria-label="Início">
          <Sparkles className="size-4 text-brand" strokeWidth={2.2} />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold tracking-tight">{copy.title}</p>
          {copy.subtitle && (
            <p className="truncate text-[11px] text-muted-foreground">{copy.subtitle}</p>
          )}
        </div>
      </div>
    </header>
  );
}
