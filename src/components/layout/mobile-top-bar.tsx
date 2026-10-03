"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark } from "@/components/layout/brand-mark";

const TITLES: Record<string, { title: string; subtitle?: string }> = {
  "/": { title: "Importar", subtitle: "Cole um link do YouTube" },
  "/library": { title: "Biblioteca", subtitle: "Projetos locais" },
  "/settings": { title: "Configurações", subtitle: "Provedores e acesso" },
};

function resolveTitle(pathname: string) {
  if (pathname.startsWith("/video/")) {
    return { title: "Workspace", subtitle: "Vídeo e transcrição" };
  }
  return TITLES[pathname] ?? { title: "Transcriber", subtitle: "Workspace local" };
}

export function MobileTopBar() {
  const pathname = usePathname();
  const copy = resolveTitle(pathname);

  return (
    <header className="glass sticky top-0 z-30 border-b border-border/70 lg:hidden">
      <div className="flex h-14 items-center gap-3 px-4">
        <Link href="/" aria-label="Início">
          <BrandMark size="md" />
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
