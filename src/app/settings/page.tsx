import { AppearanceForm } from "@/components/settings/appearance-form";
import { ChatSettingsForm } from "@/components/settings/chat-settings-form";
import { TranscriptionSettingsForm } from "@/components/settings/transcription-settings-form";
import { YoutubeAccessForm } from "@/components/settings/youtube-access-form";
import { PhaseNotice } from "@/components/foundation/phase-notice";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import type { ReactNode } from "react";
import { KeyRound, MessageSquareText, Monitor, ShieldCheck, Video } from "lucide-react";

function SettingsSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof MessageSquareText;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="surface-card hover-lift surface-in p-5 sm:p-6">
      <div className="flex gap-4">
        <span className="icon-tile grid size-10 shrink-0 place-items-center rounded-xl">
          <Icon className="size-4 text-foreground/85" strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-medium">{title}</h2>
          {description && (
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
          )}
          <div className="mt-4">{children}</div>
        </div>
      </div>
    </section>
  );
}

export default function SettingsPage() {
  return (
    <AppShell>
      <PageHeader
        label="Preferências locais"
        title="Configurações"
        description="Provedores de chat e transcrição, cookies do YouTube e aparência — tudo só neste navegador."
      />

      <div className="space-y-4">
        <SettingsSection
          icon={MessageSquareText}
          title="Provedor de chat"
          description="Modelo e chave usados no assistente sobre a transcrição."
        >
          <ChatSettingsForm />
        </SettingsSection>

        <SettingsSection
          icon={KeyRound}
          title="Transcrição"
          description="Speech-to-text quando não houver legendas utilizáveis no YouTube."
        >
          <TranscriptionSettingsForm />
        </SettingsSection>

        <SettingsSection icon={Video} title="Acesso ao YouTube">
          <YoutubeAccessForm />
        </SettingsSection>

        <SettingsSection
          icon={Monitor}
          title="Aparência"
          description="Tema claro, escuro ou conforme o sistema."
        >
          <AppearanceForm />
        </SettingsSection>
      </div>

      <div className="mt-6">
        <PhaseNotice>
          <span className="inline-flex items-center gap-2">
            <ShieldCheck className="size-4 text-brand" />
            Chaves e cookies ficam só no navegador (cookies só nesta sessão). O servidor nunca persiste cookies.txt.
          </span>
        </PhaseNotice>
      </div>
    </AppShell>
  );
}
