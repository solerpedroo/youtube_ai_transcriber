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
        <Search className="pointer-events-none absolute left-3 size-4 text-zinc-400" />
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
            className="absolute right-2 rounded p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
            onClick={() => onChange("")}
            aria-label="Limpar busca"
          >
            <X className="size-4" />
          </button>
        )}
      </label>
      {value.trim() && typeof resultCount === "number" && (
        <span className="shrink-0 text-xs text-zinc-500">{resultCount} resultado{resultCount === 1 ? "" : "s"}</span>
      )}
    </div>
  );
}
