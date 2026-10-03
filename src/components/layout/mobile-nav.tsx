"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Library, Settings2, SquarePlay } from "lucide-react";

const links = [
  { href: "/", label: "Importar", icon: SquarePlay },
  { href: "/library", label: "Biblioteca", icon: Library },
  { href: "/settings", label: "Ajustes", icon: Settings2 },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="glass fixed inset-x-0 bottom-0 z-40 border-t border-border/70 pb-[env(safe-area-inset-bottom,0px)] lg:hidden"
      aria-label="Navegação mobile"
    >
      <div className="mx-auto grid max-w-lg grid-cols-3 gap-1 px-2 py-2">
        {links.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-col items-center gap-1 rounded-lg px-2 py-2 text-[11px] font-medium transition-colors ${
                active ? "text-brand" : "text-muted-foreground"
              }`}
            >
              <span className="relative">
                {active && (
                  <span className="absolute -top-1 left-1/2 size-1 -translate-x-1/2 rounded-full bg-brand" aria-hidden />
                )}
                <Icon className="size-5" />
              </span>
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
