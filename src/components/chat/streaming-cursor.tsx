"use client";

type StreamingCursorProps = {
  className?: string;
};

export function StreamingCursor({ className = "" }: StreamingCursorProps) {
  return (
    <span
      className={`streaming-cursor ml-0.5 inline-block h-[1.1em] w-[0.45em] translate-y-px rounded-[1px] bg-current align-text-bottom ${className}`}
      aria-hidden
    />
  );
}
