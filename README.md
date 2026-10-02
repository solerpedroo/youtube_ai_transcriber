# youtube_ai_transcriber

Aplicação local-first para importar vídeos do YouTube, transcrevê-los e estudá-los com IA.

## Desenvolvimento

```powershell
npm install
npm run dev
```

Para carregar metadata, legendas e, nas próximas fases, processar áudio, instale `yt-dlp` e `ffmpeg` no `PATH` da máquina que executa o Next.js. A aplicação não baixa nem persiste arquivos de vídeo ou áudio permanentemente. Legendas existentes do YouTube são preferidas antes da transcrição por áudio.

```powershell
npm test
npm run lint
npm run build
```
