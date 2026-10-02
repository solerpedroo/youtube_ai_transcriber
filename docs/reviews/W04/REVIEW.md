# Revisão independente — W04 Transcription

Data: 2026-10-02

## Escopo revisado

- Extração de áudio (`yt-dlp`), normalização (`ffmpeg`) e duração (`ffprobe`).
- Chunking temporal, merge de timestamps e concorrência controlada.
- Adapters Groq/OpenAI Whisper, pipeline com cleanup e rota NDJSON de progresso.
- Configuração local do provedor e workspace de vídeo para disparar a transcrição.

## Resultado

| Severidade | Achado | Resolução |
| --- | --- | --- |
| High | Settings oferecia `gpt-4o-transcribe` / `gpt-4o-mini-transcribe`, incompatíveis com `verbose_json` + segmentos. | Corrigido: OpenAI fica restrito a `whisper-1` no adapter atual. |
| Medium | Pipeline seguia após o cliente abortar o fetch/aba. | Corrigido: `AbortSignal` da request propaga para a pipeline, fetch do provedor e unmount do workspace. |
| Low | Processos `yt-dlp`/`ffmpeg` em andamento só param no fim da etapa. | Risco residual aceito nesta wave; cancelamento preemptivo de filhos fica para polish futuro. |

## Verificações

- `npm test` — 38 testes aprovados.
- `npm run lint` — aprovado.
- `npm run build` — aprovado; rota `/api/transcription/start` registrada.
- `npm audit --omit=dev` — sem vulnerabilidades de produção.
- Delta pós-correção revisado: aprovado, sem novos achados bloqueantes.

## Risco residual aceito

`yt-dlp` continua ausente no `PATH` deste ambiente, então a extração live de áudio não foi validada aqui. `ffmpeg`/`ffprobe` estão disponíveis. Chaves de API nunca são logadas pelo código revisado; a integração real com Groq/OpenAI depende de chave do usuário.

## Decisões

Não houve decisão arquitetural irreversível que exija ADR. Player, busca avançada e chat permanecem fora do escopo da W04.
