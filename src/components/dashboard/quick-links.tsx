import Link from "next/link";
import { ArrowUpRight, Library, Settings2, Shield } from "lucide-react";

const links = [
  {
    href: "/library",
    label: "Biblioteca",
    description: "Retome projetos salvos neste navegador.",
    icon: Library,
  },
  {
    href: "/settings",
    label: "Provedores",
    description: "Chat, transcrição e chaves locais.",
    icon: Settings2,
  },
  {
    href: "/settings",
    label: "Acesso ao YouTube",
    description: "Cookies para vídeos privados ou restritos.",
    icon: Shield,
  },
];

export function QuickLinks() {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {links.map((item, index) => (
        <Link
          key={`${item.href}-${item.label}`}
          href={item.href}
          className={`surface-card hover-lift surface-in group flex flex-col gap-3 p-4 sm:p-5 stagger-${index + 1}`}
        >
          <div className="flex items-start justify-between gap-2">
            <span className="icon-tile grid size-10 place-items-center rounded-xl">
              <item.icon className="size-4 text-foreground/80 transition-colors group-hover:text-brand" />
            </span>
            <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand" />
          </div>
          <div>
            <p className="text-sm font-semibold">{item.label}</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.description}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
