"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Library, Settings2, SquarePlay } from "lucide-react";
import { BrandMark } from "@/components/layout/brand-mark";
import { SidebarStats } from "@/components/layout/sidebar-stats";

const links = [
  { href: "/", label: "Importar", icon: SquarePlay },
  { href: "/library", label: "Biblioteca", icon: Library },
  { href: "/settings", label: "Configurações", icon: Settings2 },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar-chrome fixed inset-y-0 left-0 z-40 hidden w-[260px] flex-col border-r border-sidebar-border lg:flex">
      <Link
        href="/"
        className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-5 transition-colors hover:bg-sidebar-accent/50"
      >
        <BrandMark size="md" />
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-semibold tracking-tight">Transcriber</p>
          <p className="truncate text-[11px] text-muted-foreground">Vídeos · legendas · chat</p>
        </div>
      </Link>

      <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Navegação principal">
        <p className="sidebar-section-label px-3 pb-2">Workspace</p>
        {links.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`relative flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] transition-colors ${
                active
                  ? "nav-active font-medium text-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
              }`}
            >
              <Icon className={`size-4 ${active ? "text-brand" : ""}`} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-3 border-t border-sidebar-border p-4">
        <SidebarStats />
        <p className="text-xs leading-5 text-muted-foreground">
          Dados locais no navegador. Nada sai da sua máquina sem você enviar.
        </p>
      </div>
    </aside>
  );
}
