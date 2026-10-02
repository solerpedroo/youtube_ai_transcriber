"use client";

import { ArrowRight, Info, Link2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ImportVideoCard() {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-10 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="pointer-events-none absolute -right-20 -top-24 size-64 rounded-full bg-violet-200/50 blur-3xl dark:bg-violet-950/30" />
      <div className="relative mx-auto max-w-2xl">
        <div className="mb-6 flex size-11 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">
          <Sparkles className="size-5" />
        </div>
        <p className="text-sm font-medium text-violet-700 dark:text-violet-300">Transcreva. Pesquise. Entenda.</p>
        <h1 className="mt-2 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">Transforme vídeos do YouTube em conhecimento pesquisável.</h1>
        <p className="mt-4 max-w-xl text-pretty leading-7 text-zinc-600 dark:text-zinc-400">Cole o link de um vídeo para importar sua transcrição e conversar sobre o conteúdo com IA.</p>

        <form className="mt-8" onSubmit={(event) => event.preventDefault()}>
          <label className="sr-only" htmlFor="youtube-url">URL do vídeo do YouTube</label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex h-12 flex-1 items-center gap-3 rounded-xl border border-zinc-300 bg-zinc-50 px-4 shadow-inner shadow-zinc-100 focus-within:border-violet-500 focus-within:ring-4 focus-within:ring-violet-500/10 dark:border-zinc-700 dark:bg-zinc-950 dark:shadow-none">
              <Link2 className="size-4 shrink-0 text-zinc-400" />
              <Input id="youtube-url" type="url" placeholder="Cole uma URL do YouTube" className="h-auto min-w-0 flex-1 border-0 bg-transparent px-0 shadow-none focus-visible:border-0 focus-visible:ring-0" />
            </div>
            <Button type="submit" size="lg" className="h-12 rounded-xl px-5">
              Importar vídeo <ArrowRight className="size-4" />
            </Button>
          </div>
        </form>
        <div className="mt-5 flex items-start gap-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
          <Info className="mt-0.5 size-3.5 shrink-0" />
          <p>Na próxima fase, validaremos links e carregaremos os dados do vídeo. Vídeos públicos e não listados serão suportados.</p>
        </div>
      </div>
    </section>
  );
}
