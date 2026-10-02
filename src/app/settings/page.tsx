import { ChatSettingsForm } from "@/components/settings/chat-settings-form";
import { TranscriptionSettingsForm } from "@/components/settings/transcription-settings-form";
import { PhaseNotice } from "@/components/foundation/phase-notice";
import { AppShell } from "@/components/layout/app-shell";
import { Bot, KeyRound, Monitor, ShieldCheck, Video } from "lucide-react";

export default function SettingsPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-medium text-violet-700 dark:text-violet-300">Preferências locais</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Configurações</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Controle como o aplicativo processa e utiliza seus vídeos.
        </p>

        <div className="mt-8 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <section className="border-b border-zinc-100 p-5 dark:border-zinc-800">
            <div className="flex gap-4">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                <Bot className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="font-medium">Provedor de IA</h2>
                <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                  Configure o provedor e modelo para o chat. A chave fica apenas neste navegador.
                </p>
                <div className="mt-4">
                  <ChatSettingsForm />
                </div>
              </div>
            </div>
          </section>

          <section className="border-b border-zinc-100 p-5 dark:border-zinc-800">
            <div className="flex gap-4">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                <KeyRound className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="font-medium">Transcrição</h2>
                <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                  Escolha o provedor de speech-to-text e informe a chave de API usada apenas neste navegador.
                </p>
                <div className="mt-4">
                  <TranscriptionSettingsForm />
                </div>
              </div>
            </div>
          </section>

          <section className="flex gap-4 border-b border-zinc-100 p-5 dark:border-zinc-800">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              <Video className="size-4" />
            </span>
            <div>
              <h2 className="font-medium">Acesso ao YouTube</h2>
              <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                Use cookies.txt apenas para vídeos aos quais você tem acesso.
              </p>
              <span className="mt-2 inline-block text-xs font-medium text-zinc-400">Em breve</span>
            </div>
          </section>

          <section className="flex gap-4 p-5">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              <Monitor className="size-4" />
            </span>
            <div>
              <h2 className="font-medium">Aparência</h2>
              <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                Escolha entre tema claro, escuro ou do sistema.
              </p>
              <span className="mt-2 inline-block text-xs font-medium text-zinc-400">Em breve</span>
            </div>
          </section>
        </div>

        <div className="mt-6">
          <PhaseNotice>
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="size-4" />
              As chaves de chat e transcrição ficam apenas neste navegador e não devem ser registradas em logs do servidor.
            </span>
          </PhaseNotice>
        </div>
      </div>
    </AppShell>
  );
}
