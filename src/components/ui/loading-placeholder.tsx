import { cn } from "cn";

type LoadingPlaceholderProps = {
  lines?: number;
  className?: string;
};

export function LoadingPlaceholder({ lines = 3, className }: LoadingPlaceholderProps) {
  return (
    <div className={cn("animate-pulse space-y-3", className)} aria-hidden>
      {Array.from({ length: lines }, (_, index) => (
        <div
          key={index}
          className="h-3 rounded-md bg-muted"
          style={{ width: `${Math.max(40, 100 - index * 18)}%` }}
        />
      ))}
    </div>
  );
}
