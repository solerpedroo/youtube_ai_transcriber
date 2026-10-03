import type { ReactNode } from "react";
import { AppSidebar } from "./app-sidebar";
import { MobileNav } from "./mobile-nav";
import { MobileTopBar } from "./mobile-top-bar";

type AppShellProps = {
  children: ReactNode;
  compact?: boolean;
};

export function AppShell({ children, compact = false }: AppShellProps) {
  return (
    <div className="relative min-h-screen">
      <a
        href="#conteudo-principal"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-brand focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-brand-foreground"
      >
        Ir para o conteúdo
      </a>

      <AppSidebar />

      <div className="flex min-h-screen flex-col lg:pl-[260px]">
        <MobileTopBar />
        <main
          id="conteudo-principal"
          tabIndex={-1}
          className={`relative flex-1 pb-nav ${compact ? "px-3 py-4 sm:px-5 lg:px-8 lg:py-6" : "px-3 py-6 sm:px-5 lg:px-8 lg:py-8"}`}
        >
          <div className="canvas-grid pointer-events-none absolute inset-x-0 top-0 h-72" aria-hidden />
          <div className={`relative mx-auto w-full ${compact ? "max-w-7xl" : "max-w-5xl"}`}>
            {children}
          </div>
        </main>
        <MobileNav />
      </div>
    </div>
  );
}
