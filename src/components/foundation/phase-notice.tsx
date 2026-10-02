import type { ReactNode } from "react";
import { Construction } from "lucide-react";

export function PhaseNotice({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-dashed border-zinc-300 bg-zinc-100/60 p-4 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-400">
      <Construction className="mt-0.5 size-4 shrink-0 text-zinc-500" />
      <p>{children}</p>
    </div>
  );
}
