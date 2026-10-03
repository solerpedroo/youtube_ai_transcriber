import type { ReactNode } from "react";

type StatusMessageProps = {
  tone?: "neutral" | "loading" | "error" | "success";
  children: ReactNode;
  className?: string;
};

const TONE_CLASS: Record<NonNullable<StatusMessageProps["tone"]>, string> = {
  neutral: "border-border bg-muted/40 text-muted-foreground",
  loading: "border-brand/20 bg-brand/5 text-foreground",
  error: "border-destructive/30 bg-destructive/10 text-destructive",
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
};

/** Compact status banner for loading, error, and empty helper copy. */
export function StatusMessage({ tone = "neutral", children, className = "" }: StatusMessageProps) {
  const role = tone === "error" ? "alert" : tone === "loading" ? "status" : undefined;
  const live = tone === "loading" ? "polite" : undefined;
  return (
    <p
      role={role}
      aria-live={live}
      className={`rounded-lg border px-3 py-2 text-sm leading-6 ${TONE_CLASS[tone]} ${className}`.trim()}
    >
      {children}
    </p>
  );
}
