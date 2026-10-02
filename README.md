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
