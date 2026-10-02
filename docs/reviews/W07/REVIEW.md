# Revisão independente — W07 Transcript grounding

Data: 2026-10-02

## Escopo revisado

- Chunking de segmentos com overlap (`chunk-transcript`).
- Retrieval leve por overlap de palavras-chave (`retrieval`).
- Context builder grounded (transcrição completa ≤24k chars ou top-K trechos).
- Parsing/split de citações `[m:ss]` / `[h:mm:ss]` e seek no player.
- Rota `POST /api/chat` com `transcriptSegments` e painel/workspace integrados.

## Resultado

| Severidade | Achado | Resolução |
| --- | --- | --- |
| High | Teto Zod de 8k segmentos rejeitava chats de vídeos longos. | Corrigido: limite elevado para 50k; erro de `transcriptSegments` com mensagem dedicada. |
| Medium | Payload enviava `fullText` e segmentos em todo turno. | Corrigido: painel envia só segmentos quando existem; senão `transcriptText`. |
| Low | Botões de citação sem `aria-label`. | Corrigido: `aria-label` espelhando o título de seek. |

## Verificações

- `npm test` — 61 testes aprovados.
- `npm run lint` — aprovado.
- `npm run build` — aprovado; rota `/api/chat` registrada.
- `npm audit --omit=dev` — sem vulnerabilidades de produção.
- Bugbot (branch changes) — achados high/medium tratados; delta pós-correção sem bloqueantes novos.

## Risco residual aceito

Retrieval é lexical (não semântico); perguntas com sinônimos fracos podem cair no fallback dos primeiros chunks. Integração live com provedores depende de chaves do usuário e não foi exercitada neste ambiente. Cookies / vídeos privados permanecem na W08.

## Decisões

Não houve decisão arquitetural irreversível que exija ADR. O limite FULL_TRANSCRIPT_CHAR_LIMIT (24k) vs MAX_TRANSCRIPT_CONTEXT_CHARS (80k) permanece intencional: abaixo de 24k manda tudo; acima recupera trechos.
