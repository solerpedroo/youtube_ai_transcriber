import { cn } from "cn";

type YoutubeIconProps = {
  className?: string;
  title?: string;
};

/** Ícone YouTube (#FF0033): squircle + triângulo play (proporção oficial ~136×96). */
export function YoutubeIcon({ className, title = "YouTube" }: YoutubeIconProps) {
  return (
    <svg
      viewBox="0 0 136 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("block h-[1em] w-[calc(1em*136/96)] shrink-0", className)}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <rect width="136" height="96" rx="22" fill="#FF0033" />
      <path fill="#FFFFFF" d="M54 72V24l44 24-44 24Z" />
    </svg>
  );
}
