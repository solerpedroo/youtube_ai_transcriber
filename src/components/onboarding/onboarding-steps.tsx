"use client";

import type { LucideIcon } from "lucide-react";
import {
  Cookie,
  FileText,
  KeyRound,
  MessageSquareText,
  Rocket,
  ShieldCheck,
  ListOrdered,
  SquarePlay,
  Upload,
} from "lucide-react";
import type { ReactNode } from "react";

export type OnboardingStepId =
  | "welcome"
  | "api-keys"
  | "cookies-guide"
  | "cookies-upload"
  | "get-started";

export type OnboardingStep = {
  id: OnboardingStepId;
  eyebrow: string;
  title: string;
  lead: string;
  pathname: "/" | "/settings";
  hash?: string;
  highlightSelector?: string;
  featureCards?: Array<{ icon: LucideIcon; title: string; description: string }>;
  body?: ReactNode;
};

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    eyebrow: "Bem-vindo",
    title: "Seu workspace para estudar vídeos do YouTube",
    lead: "Importe links, obtenha transcrições e converse com o conteúdo — com projetos e preferências guardados no seu navegador.",
    pathname: "/",
    featureCards: [
      {
        icon: SquarePlay,
        title: "Importar vídeos",
        description: "Cole a URL na página inicial. Buscamos metadata e legendas quando disponíveis.",
      },
      {
        icon: FileText,
        title: "Transcrever com qualidade",
        description: "Priorizamos legendas do YouTube; se não houver, usamos speech-to-text com o provedor que você escolher.",
      },
      {
        icon: MessageSquareText,
        title: "Chat sobre a transcrição",
        description: "Faça perguntas com contexto do vídeo. Respostas em markdown, dados locais no dispositivo.",
      },
    ],
  },
  {
    id: "api-keys",
    eyebrow: "Chaves de API",
    title: "Onde colar suas chaves",
    lead: "A plataforma usa BYOK: você traz as chaves dos provedores de chat e transcrição. Elas ficam só nesta sessão do navegador após salvar.",
    pathname: "/settings",
    hash: "onboarding-api-keys",
    highlightSelector: "#onboarding-api-keys",
    featureCards: [
      {
        icon: MessageSquareText,
        title: "Provedor de chat",
        description: "Configurações → seção Provedor de chat → campo Chave de API (OpenAI, Anthropic, Gemini, Groq ou compatible).",
      },
      {
        icon: KeyRound,
        title: "Transcrição",
        description: "Configurações → seção Transcrição → Chave de API (OpenAI ou Groq) e modelo Whisper.",
      },
      {
        icon: ShieldCheck,
        title: "Privacidade",
        description: "Chaves não são gravadas no localStorage persistente; o servidor só as usa para repassar ao provedor na requisição.",
      },
    ],
  },
  {
    id: "cookies-guide",
    eyebrow: "Cookies do YouTube",
    title: "Como obter o cookies.txt",
    lead: "Só necessário para vídeos privados, membros ou restritos aos quais você já tem acesso legítimo.",
    pathname: "/settings",
    body: (
      <ol className="list-decimal space-y-3 pl-5 text-sm leading-6 text-muted-foreground">
        <li>
          <span className="font-medium text-foreground">Extensão de navegador (recomendado):</span>{" "}
          instale uma extensão confiável do tipo &quot;Get cookies.txt LOCALLY&quot;, faça login no YouTube no mesmo
          navegador e exporte o arquivo para <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">cookies.txt</code>{" "}
          (formato Netscape).
        </li>
        <li>
          <span className="font-medium text-foreground">Linha de comando (avançado):</span>{" "}
          com <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">yt-dlp --cookies-from-browser chrome</code>{" "}
          você pode gerar um cookies.txt a partir do perfil logado — use apenas em máquinas que você controla.
        </li>
        <li>
          <span className="font-medium text-foreground">Boas práticas:</span> exporte só cookies do domínio YouTube,
          não compartilhe o arquivo e troque-o se suspeitar de vazamento.
        </li>
      </ol>
    ),
    featureCards: [
      {
        icon: Cookie,
        title: "Formato Netscape",
        description: "Arquivo .txt com linhas tab-separadas; a app valida antes de enviar ao servidor.",
      },
      {
        icon: ShieldCheck,
        title: "Uso responsável",
        description: "Respeite os Termos do YouTube e use cookies apenas para conteúdo que você pode acessar.",
      },
    ],
  },
  {
    id: "cookies-upload",
    eyebrow: "Anexar cookies",
    title: "Onde enviar o cookies.txt",
    lead: "O upload fica em Configurações. O arquivo vale só para esta sessão do navegador — não persistimos cookies no servidor.",
    pathname: "/settings",
    hash: "onboarding-youtube",
    highlightSelector: "#onboarding-youtube",
    featureCards: [
      {
        icon: Upload,
        title: "Acesso ao YouTube",
        description: "Configurações → Acesso ao YouTube → botão Enviar cookies.txt.",
      },
      {
        icon: Rocket,
        title: "Uso automático",
        description: "Depois de carregar, importações e transcrições nesta sessão enviam os cookies quando necessário.",
      },
    ],
  },
  {
    id: "get-started",
    eyebrow: "Pronto para começar",
    title: "Importe seu primeiro vídeo",
    lead: "Com chaves (e cookies, se precisar) configurados, volte à página inicial e cole a URL do YouTube.",
    pathname: "/",
    highlightSelector: "[data-onboarding=import-video]",
    featureCards: [
      {
        icon: ListOrdered,
        title: "Fluxo sugerido",
        description: "1) Configurar chaves → 2) Importar URL → 3) Abrir workspace → 4) Chat sobre a transcrição.",
      },
      {
        icon: FileText,
        title: "Biblioteca",
        description: "Todos os projetos ficam em Biblioteca, acessíveis pelo menu lateral.",
      },
    ],
  },
];
