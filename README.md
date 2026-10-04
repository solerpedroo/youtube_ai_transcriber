# YouTube AI Transcriber

Repositório: [github.com/solerpedroo/youtube_ai_transcriber](https://github.com/solerpedroo/youtube_ai_transcriber)

Aplicação **local-first** para importar vídeos do YouTube, obter transcrições de qualidade e estudar o conteúdo com chat contextual sobre a transcrição. Projetos, legendas e preferências ficam no seu navegador; o servidor processa apenas o necessário (metadata, legendas, áudio temporário e chamadas aos provedores de IA que **você** configura.

---

## Por que usar

Vídeos longos são difíceis de revisar, citar e pesquisar. Este projeto une três fluxos em um só lugar:

1. **Importar** um link do YouTube e enriquecer com título, thumbnail e transcrição.
2. **Transcrever** preferindo legendas oficiais do YouTube quando existirem; caso contrário, extrai áudio e envia ao provedor de speech-to-text configurado.
3. **Conversar** com um modelo de linguagem usando a transcrição como contexto, com respostas em markdown e referências temporais quando aplicável.

O foco é **controle dos seus dados e das suas chaves**: BYOK (bring your own key), sem conta centralizada na aplicação.

---

## Funcionalidades

| Área | O que você pode fazer |
|------|------------------------|
| **Início** | Visão geral, atalhos e importação rápida de URL |
| **Biblioteca** | Lista de projetos salvos localmente; abrir vídeo pelo card inteiro |
| **Workspace do vídeo** | Player, transcrição segmentada, busca, exportação (TXT, Markdown, JSON, SRT, VTT) |
| **Transcrição** | Legendas via `yt-dlp` ou pipeline de áudio + Whisper (OpenAI / Groq) |
| **Chat** | Streaming NDJSON; provedores OpenAI, Anthropic, Gemini, Groq ou OpenAI-compatible |
| **Configurações** | Provedores, modelos, tema claro/escuro/sistema, cookies opcionais para vídeos restritos |

---

## Como funciona (visão geral)

```text
URL YouTube
    │
    ├─► Metadata / legendas (yt-dlp) ──► preferir legendas existentes
    │
    └─► Sem legenda adequada?
            └─► Extrair áudio (ffmpeg) ──► chunks ──► API de transcrição
                    │
                    ▼
            Transcrição no projeto (localStorage)
                    │
                    └─► Chat (/api/chat) com contexto da transcrição
```

- **Áudio** é processado em diretório temporário no servidor e **não** é persistido como arquivo de produto.
- **Cookies** (formato Netscape) podem ser enviados por requisição para conteúdo privado/restrito; não são gravados no servidor.
- **Chaves de API** de transcrição e chat são mantidas em `sessionStorage` após salvar configurações (não permanecem no `localStorage`).

---

## Stack técnica

- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS 4, Radix UI / shadcn
- **Estado local:** Zustand + persistência em `localStorage` (projetos e settings sem chaves)
- **Validação:** Zod
- **Testes:** Vitest
- **Processamento server-side:** `yt-dlp`, `ffmpeg` / `ffprobe`, Node.js (`runtime: nodejs` nas rotas de API)

---

## Pré-requisitos

| Requisito | Uso |
|-----------|-----|
| **Node.js** 20+ | Desenvolvimento e build |
| **npm** | Dependências e scripts |
| **yt-dlp** | Metadata e legendas do YouTube |
| **ffmpeg** e **ffprobe** | Normalização e chunking de áudio para transcrição |

**Desenvolvimento local:** instale `yt-dlp` e `ffmpeg`/`ffprobe` no **PATH** (ou deixe o npm usar os pacotes `yt-dlp-exec`, `ffmpeg-static` e `ffprobe-static` após `npm install`).

**Vercel:** o repositório já inclui esses pacotes e `vercel.json` com limites de duração/memória das funções — veja [Deploy na Vercel](#deploy-na-vercel).

---

## Instalação e desenvolvimento

```powershell
git clone https://github.com/solerpedroo/youtube_ai_transcriber.git
cd youtube_ai_transcriber
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

Em **Configurações**, informe:

- Provedor e modelo de **transcrição** (OpenAI ou Groq) e chave correspondente.
- Provedor e modelo de **chat** (OpenAI, Anthropic, Gemini, Groq ou base URL OpenAI-compatible).

### Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm start` | Servidor após o build |
| `npm test` | Testes unitários (Vitest) |
| `npm run lint` | ESLint |

---

## Deploy na Vercel

1. Importe o repositório [github.com/solerpedroo/youtube_ai_transcriber](https://github.com/solerpedroo/youtube_ai_transcriber) em [vercel.com/new](https://vercel.com/new) (Framework Preset: **Next.js**).
2. **Node.js 20+** — a Vercel detecta `engines` no `package.json`.
3. Variáveis de ambiente: copie de [`.env.example`](.env.example) para **Settings → Environment Variables** (Production e Preview, se quiser).
4. **Plano Pro (recomendado)** para transcrição longa:
   - `/api/transcription/start` usa até **300 s** (`maxDuration` + `vercel.json`).
   - No Hobby, o teto da Vercel para funções serverless é menor — importação com legendas costuma funcionar; transcrição por áudio pode estourar tempo em vídeos longos.
5. **Deploy público:** defina `API_ACCESS_SECRET` e coloque um proxy (Cloudflare Worker, etc.) que injete `x-api-access-secret`, **ou** aceite que a UI browser-only depende do guard de origem + rate limit (ver Segurança).
6. Após o deploy, abra a URL, conclua o **tour de onboarding** e configure chaves em **Configurações**.

O build baixa o binário do **yt-dlp** via `postinstall` do `yt-dlp-exec` e empacota **ffmpeg/ffprobe** estáticos para Linux na função Node.

---

## Variáveis de ambiente (opcional)

Crie um `.env.local` na raiz (dev) ou configure no painel da Vercel — referência em [`.env.example`](.env.example):

| Variável | Descrição |
|----------|-----------|
| `API_ACCESS_SECRET` | Segredo compartilhado; exige header `x-api-access-secret` (ou `Authorization: Bearer`) nas rotas `/api/*`. Indicado quando a app fica atrás de um proxy que injeta o header — a UI não envia esse valor. |
| `OPENAI_COMPATIBLE_ALLOWED_HOSTS` | Lista de hosts permitidos separados por vírgula (ex.: `api.example.com,openrouter.ai`) para restringir `baseUrl` do provedor OpenAI-compatible. |
| `TRUST_PROXY` | Defina como `true` se estiver atrás de proxy confiável para o rate limit usar `X-Forwarded-For`. |

---

## Segurança

A aplicação foi desenhada para uso **local** ou **self-hosted** com BYOK. Em deploy exposto na internet, combine proxy, segredos e allowlists acima.

Medidas implementadas no código:

- Validação estrita de URLs YouTube antes de invocar `yt-dlp`.
- Guard nas APIs: rate limit, checagem de origem (navegador), limite de tamanho do JSON.
- Endpoints OpenAI-compatible: bloqueio de SSRF (host, DNS, sem redirects automáticos).
- Sanitização de links no markdown do chat.
- Respostas de erro genéricas ao cliente; detalhes sensíveis do provedor não são expostos na UI.
- CSP e headers de segurança via `next.config.ts`.

Limitações conscientes:

- Chaves ainda trafegam do browser para o servidor nas requisições de chat/transcrição (necessário para o modelo atual BYOK).
- Rate limit in-memory é por instância do processo; em serverless, prefira WAF ou limitação no edge.
- CSP de produção ainda permite inline/eval exigidos pelo pipeline Next — trate XSS como risco principal para chaves na sessão do browser.

---

## Estrutura do repositório (resumo)

```text
src/
├── app/                 # Rotas App Router e API routes (/api/chat, youtube, transcription)
├── components/          # UI (dashboard, library, chat, settings, layout)
├── lib/
│   ├── ai/              # Provedores de chat, contexto, streaming
│   ├── security/        # Guards, SSRF, sanitização
│   ├── storage/         # Persistência local e migrações
│   ├── transcription/   # Pipeline de áudio e provedores STT
│   ├── youtube/         # yt-dlp, legendas, ffmpeg
│   └── transcript/      # Busca e exportações
└── types/               # Tipos e schemas compartilhados
```

---

## Contribuição e licença

Projeto em evolução (`0.1.0`). Antes de abrir PRs, rode `npm test`, `npm run lint` e `npm run build`.

Licença: consulte o repositório remoto ou adicione um arquivo `LICENSE` conforme a política do mantenedor.

---

## Aviso de uso

Respeite os [Termos de Serviço do YouTube](https://www.youtube.com/t/terms) e as políticas dos provedores de IA que você utilizar. Use cookies e transcrição apenas para conteúdo ao qual você tem direito de acesso. Esta ferramenta não substitui revisão humana nem garante precisão absoluta das transcrições ou respostas do chat.
