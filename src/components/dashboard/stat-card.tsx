import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  accent?: "brand" | "success" | "muted";
};

const ACCENT_BAR: Record<NonNullable<StatCardProps["accent"]>, string> = {
  brand: "bg-brand",
  success: "bg-emerald-500",
  muted: "bg-muted-foreground/40",
};

export function StatCard({ label, value, hint, icon: Icon, accent = "brand" }: StatCardProps) {
  return (
    <div className="surface-card hover-lift surface-in relative overflow-hidden p-4 sm:p-5">
      <div className={`absolute inset-x-0 top-0 h-0.5 ${ACCENT_BAR[accent]}`} aria-hidden />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="label-caps">{label}</p>
          <p className="stat-value mt-2 text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
          {hint && <p className="mt-1 text-xs leading-5 text-muted-foreground">{hint}</p>}
        </div>
        <span className="icon-tile grid size-10 place-items-center rounded-xl">
          <Icon className={`size-4 ${accent === "brand" ? "text-brand" : "text-muted-foreground"}`} />
        </span>
      </div>
    </div>
  );
}
