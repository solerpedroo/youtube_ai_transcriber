# Revisão independente — W02 YouTube

Data: 2026-10-02

## Escopo revisado

- Validação de URLs do YouTube, endpoint de metadata e DTO de resposta.
- Execução segura de `yt-dlp` e wrapper de `ffmpeg`.
- Diretórios temporários, timeout, limite de saída, cleanup e erros de processo.

## Resultado

| Severidade | Achado | Resolução |
| --- | --- | --- |
| Medium | Cleanup poderia remover caminho arbitrário. | Corrigido: apenas diretórios sob o namespace temporário `youtube-ai-*` são removidos; a função retorna falha sem lançar. |
| Medium | Validação real com vídeos públicos não pôde ser executada. | Risco residual registrado: `yt-dlp` e `ffmpeg` não estão no `PATH` deste ambiente. |
| Low | JSON malformado retornava erro interno. | Corrigido: a API retorna `400 INVALID_URL`. |
| Low | `webpage_url` de yt-dlp não era reaplicada à allowlist. | Corrigido: URL canônica externa é descartada em favor da URL validada. |

## Verificações

- `npm test` — 20 testes aprovados.
- `npm run lint` — aprovado.
- `npx tsc --noEmit` — aprovado.
- `npm run build` — aprovado.
- `npm audit --omit=dev` — sem vulnerabilidades de produção.
- Delta pós-correção revisado de forma independente: aprovado, sem novos achados.

## Risco residual aceito

Os binários de sistema `yt-dlp` e `ffmpeg` estão ausentes. Assim, a integração live com vídeos públicos continua pendente e deve ser executada antes de disponibilizar o produto em ambiente de uso. Os testes automatizados cobrem a validação, o DTO, processo controlado e cleanup.

## Decisões

Não houve decisão arquitetural irreversível que exija ADR nesta wave.
