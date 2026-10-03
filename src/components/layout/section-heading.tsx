type SectionHeadingProps = {
  title: string;
  description?: string;
  className?: string;
};

export function SectionHeading({ title, description, className = "" }: SectionHeadingProps) {
  return (
    <div className={`mb-3 ${className}`.trim()}>
      <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
      {description && <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{description}</p>}
    </div>
  );
}
