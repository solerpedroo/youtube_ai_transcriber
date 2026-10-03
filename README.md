# youtube_ai_transcriber

Aplicação local-first para importar vídeos do YouTube, transcrevê-los e estudá-los com IA.

## Desenvolvimento

```powershell
npm install
npm run dev
```

Para carregar metadata, legendas e transcrever áudio, instale `yt-dlp` e `ffmpeg`/`ffprobe` no `PATH` da máquina que executa o Next.js. Em Configurações, informe as chaves do provedor de transcrição e do chat (OpenAI, Anthropic, Gemini, Groq ou endpoint OpenAI-compatible). A aplicação não persiste áudio no servidor; legendas existentes do YouTube são preferidas antes da transcrição por áudio.

```powershell
npm test
npm run lint
npm run build
```

## Segurança (deploy exposto)

- Chaves de API ficam em `sessionStorage` (não persistem no `localStorage` após salvar configurações).
- Rotas `/api/*` aplicam rate limit, validação de origem (browser), limite de tamanho do JSON e `YouTubeUrlSchema` nas URLs.
- Provedor **OpenAI-compatible**: use `OPENAI_COMPATIBLE_ALLOWED_HOSTS` (hosts separados por vírgula) e evite bases URL arbitrárias em produção.
- Deploy público: defina `API_ACCESS_SECRET` e injete o header `x-api-access-secret` no proxy (a UI local não envia esse segredo).
- Atrás de proxy confiável: `TRUST_PROXY=true` para rate limit usar `X-Forwarded-For`.
