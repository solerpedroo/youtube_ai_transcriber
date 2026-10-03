import type { ReactNode } from "react";

type SettingsFieldProps = {
  label: string;
  htmlFor?: string;
  children: ReactNode;
};

/** Label + control spacing shared across settings forms. */
export function SettingsField({ label, htmlFor, children }: SettingsFieldProps) {
  return (
    <div className="grid gap-1.5 text-sm">
      <span className="font-medium" id={htmlFor ? `${htmlFor}-label` : undefined}>
        {label}
      </span>
      {children}
    </div>
  );
}
