import type { ReactNode } from "react";
import { Construction } from "lucide-react";

export function PhaseNotice({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
      <Construction className="mt-0.5 size-4 shrink-0 text-brand" />
      <p>{children}</p>
    </div>
  );
}
