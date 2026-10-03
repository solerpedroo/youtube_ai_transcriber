import { YoutubeIcon } from "@/components/brand/youtube-icon";
import { cn } from "cn";

const HEIGHT = {
  sm: "text-[1.75rem]",
  md: "text-[2rem]",
  lg: "text-[2.25rem]",
} as const;

type BrandMarkProps = {
  size?: keyof typeof HEIGHT;
  className?: string;
};

/** Logo YouTube — largura segue proporção 136:96 via `1em` no ícone. */
export function BrandMark({ size = "md", className }: BrandMarkProps) {
  return (
    <span className={cn("inline-flex shrink-0 items-center leading-none", HEIGHT[size], className)}>
      <YoutubeIcon />
    </span>
  );
}
