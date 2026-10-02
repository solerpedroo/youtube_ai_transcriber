import type { ReactNode } from "react";

type StatusMessageProps = {
  tone?: "neutral" | "loading" | "error" | "success";
  children: ReactNode;
  className?: string;
};

const TONE_CLASS: Record<NonNullable<StatusMessageProps["tone"]>, string> = {
  neutral: "border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400",
  loading: "border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400",
  error: "border-red-200 bg-red-50 text-red-700 dark:border-red-950 dark:bg-red-950/30 dark:text-red-300",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-950 dark:bg-emerald-950/30 dark:text-emerald-300",
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
