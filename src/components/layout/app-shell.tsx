import type { ReactNode } from "react";
import { Navigation } from "./navigation";

type AppShellProps = {
  children: ReactNode;
  compact?: boolean;
};

export function AppShell({ children, compact = false }: AppShellProps) {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950 selection:bg-violet-200 selection:text-violet-950 dark:bg-zinc-950 dark:text-zinc-50">
      <Navigation />
      <main className={compact ? "mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8" : "mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8"}>
        {children}
      </main>
    </div>
  );
}
