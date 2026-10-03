import type { ReactNode } from "react";
import { Info } from "lucide-react";

export function AppNotice({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
      <Info className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
      <div className="min-w-0 leading-6">{children}</div>
    </div>
  );
}
