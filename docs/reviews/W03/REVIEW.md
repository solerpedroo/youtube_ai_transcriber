# Revisão independente — W03 Captions

Data: 2026-10-02

## Escopo revisado

- Detecção de tracks manuais e automáticas via catálogo `yt-dlp`.
- Seleção com prioridade manual > automática e ranking pt/en.
- Extração de VTT em diretório temporário com cleanup em `finally`.
- Parser WebVTT, normalização de cues rolantes e DTO de transcript.
- Rota `POST /api/youtube/subtitles` e preferência por legendas na criação do projeto.

## Resultado

| Severidade | Achado | Resolução |
| --- | --- | --- |
| Medium | `mapSubtitleFailure` tratava qualquer stderr com `not available` como `VIDEO_NOT_FOUND`, inclusive falhas de formato de legenda. | Corrigido: apenas mensagens de vídeo indisponível (`video unavailable`, `video not available`, `incomplete youtube id`) mapeiam para 404 de vídeo. |
| Low | Idioma inválido na API respondia `INVALID_URL`. | Corrigido: código `INVALID_LANGUAGE` com mensagem própria; regex restringe o formato do idioma. |
| Low | Idioma vindo do catálogo ia direto para `--sub-langs`. | Mitigado: validação defensiva `[A-Za-z0-9._-]+` antes de invocar `yt-dlp`. |

## Verificações

- `npm test` — 31 testes aprovados.
- `npm run lint` — aprovado.
- `npx tsc --noEmit` — aprovado (após `next build` gerar tipos de rota).
- `npm run build` — aprovado; rota `/api/youtube/subtitles` registrada.
- `npm audit --omit=dev` — sem vulnerabilidades de produção.
- Delta pós-correção revisado: aprovado, sem novos achados bloqueantes.

## Risco residual aceito

`yt-dlp` continua ausente no `PATH` deste ambiente. A integração live com vídeos públicos permanece pendente e deve ser executada antes do uso em produção. Os testes automatizados cobrem parsing VTT, normalização, prioridade de tracks, validação de catálogo e contratos de erro da API.

## Decisões

Não houve decisão arquitetural irreversível que exija ADR nesta wave. Legendas continuam preferidas à transcrição por áudio; a UI de workspace/player permanece fora do escopo da W03.
