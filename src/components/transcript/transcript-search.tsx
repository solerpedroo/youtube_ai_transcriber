"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

type TranscriptSearchProps = {
  value: string;
  onChange: (value: string) => void;
  resultCount?: number;
};

export function TranscriptSearch({ value, onChange, resultCount }: TranscriptSearchProps) {
  return (
    <div className="flex items-center gap-2">
      <label className="relative flex min-w-0 flex-1 items-center">
        <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Buscar na transcrição..."
          aria-label="Buscar na transcrição"
          className="h-10 rounded-lg pl-9 pr-9"
        />
        {value && (
          <button
            type="button"
            className="absolute right-2 rounded p-1 text-muted-foreground hover:text-foreground"
            onClick={() => onChange("")}
            aria-label="Limpar busca"
          >
            <X className="size-4" />
          </button>
        )}
      </label>
      {value.trim() && typeof resultCount === "number" && (
        <span className="shrink-0 rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
          {resultCount} resultado{resultCount === 1 ? "" : "s"}
        </span>
      )}
    </div>
  );
}
