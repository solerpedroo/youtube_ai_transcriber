import Link from "next/link";
import { Clock3, Search, Video } from "lucide-react";
import { PhaseNotice } from "@/components/foundation/phase-notice";
import { AppShell } from "@/components/layout/app-shell";

export default function LibraryPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-sm font-medium text-violet-700 dark:text-violet-300">Seu espaço local</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Biblioteca</h1><p className="mt-2 text-zinc-600 dark:text-zinc-400">Vídeos e transcrições salvos neste dispositivo.</p></div>
          <Link href="/" className="inline-flex h-10 items-center justify-center rounded-lg bg-zinc-950 px-4 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-950">Nova transcrição</Link>
        </div>
        <div className="mt-8 flex h-11 items-center gap-3 rounded-xl border border-zinc-200 bg-white px-3 text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900"><Search className="size-4" /><input aria-label="Pesquisar vídeos" placeholder="Pesquisar vídeos..." className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400" /></div>
        <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-12">
          <span className="mx-auto grid size-12 place-items-center rounded-xl bg-zinc-100 text-zinc-500 dark:bg-zinc-800"><Video className="size-5" /></span>
          <h2 className="mt-4 text-lg font-semibold">Sua biblioteca está vazia</h2><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-zinc-600 dark:text-zinc-400">Quando você importar um vídeo, sua transcrição aparecerá aqui para consulta futura.</p>
          <div className="mt-5 inline-flex items-center gap-2 text-xs text-zinc-500"><Clock3 className="size-3.5" />Armazenado somente neste navegador</div>
        </div>
        <div className="mt-6"><PhaseNotice>A listagem, a busca e a exclusão de projetos locais serão conectadas na fase de persistência.</PhaseNotice></div>
      </div>
    </AppShell>
  );
}
