# Revisão independente — W06 AI chat

Data: 2026-10-02

## Escopo revisado

- Interface de provedores com streaming (OpenAI, Anthropic, Gemini, Groq, OpenAI-compatible).
- Rota `POST /api/chat` NDJSON, validação de input e abort.
- Painel de chat, atalhos, persistência local e formulário de settings.

## Resultado

| Severidade | Achado | Resolução |
| --- | --- | --- |
| High | Estado do chat podia vazar entre projetos na navegação client-side. | Corrigido: `ChatPanel` remonta com `key={project.id}`. |
| Medium | Histórico com respostas longas falhava no limite de 20k chars. | Corrigido: limite de conteúdo elevado para 100k. |
| Medium | Última linha SSE sem newline final era descartada. | Corrigido: flush do buffer residual ao encerrar o stream. |

## Verificações

- `npm test` — 53 testes aprovados.
- `npm run lint` — aprovado.
- `npm run build` — aprovado; rota `/api/chat` registrada.
- `npm audit --omit=dev` — sem vulnerabilidades de produção.
- Delta pós-correção revisado: aprovado, sem novos achados bloqueantes.

## Risco residual aceito

Integração live com provedores depende de chaves do usuário e não foi exercitada neste ambiente. A recuperação avançada por trechos e citações permanece na W07; o contexto atual envia a transcrição completa (com limite de tamanho).

## Decisões

Não houve decisão arquitetural irreversível que exija ADR. Retrieval/citações ficam explicitamente fora desta wave.
