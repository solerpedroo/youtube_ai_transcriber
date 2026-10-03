import { cn } from "cn";

const SIZE = {
  sm: "size-8 rounded-lg",
  md: "size-9 rounded-xl",
  lg: "size-10 rounded-xl",
} as const;

type BrandMarkProps = {
  size?: keyof typeof SIZE;
  className?: string;
};

function PlayGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="M9.5 7.8v8.4c0 .6.7 1 1.2.65l7.2-4.2c.5-.3.5-1 0-1.3l-7.2-4.15c-.5-.35-1.2.05-1.2.65Z" />
    </svg>
  );
}

/** Marca vermelha estilo YouTube (play em tile sólido). */
export function BrandMark({ size = "md", className }: BrandMarkProps) {
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center bg-brand text-brand-foreground shadow-sm ring-1 ring-black/5 dark:ring-white/10",
        SIZE[size],
        className,
      )}
      aria-hidden
    >
      <PlayGlyph className={size === "sm" ? "size-4" : "size-5"} />
    </span>
  );
}
