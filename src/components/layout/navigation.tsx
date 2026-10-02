"use client";

import Link from "next/link";
import { Library, Settings2, SquarePlay } from "lucide-react";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Nova transcrição", icon: SquarePlay },
  { href: "/library", label: "Biblioteca", icon: Library },
  { href: "/settings", label: "Configurações", icon: Settings2 },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200/80 bg-zinc-50/80 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight" aria-label="YouTube AI Transcriber, início">
          <span className="grid size-8 place-items-center rounded-lg bg-zinc-950 text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-950">
            <SquarePlay className="size-4" strokeWidth={2.4} />
          </span>
          <span className="hidden sm:inline">YouTube AI Transcriber</span>
          <span className="sm:hidden">AI Transcriber</span>
        </Link>
        <nav className="flex items-center gap-1" aria-label="Navegação principal">
          {links.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors sm:px-3 ${active ? "bg-zinc-200 text-zinc-950 dark:bg-zinc-800 dark:text-zinc-50" : "text-zinc-600 hover:bg-zinc-200/70 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"}`}
                href={href}
                key={href}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="size-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
