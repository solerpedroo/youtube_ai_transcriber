# Revisão independente — W05 Workspace

Data: 2026-10-02

## Escopo revisado

- Player YouTube via IFrame API, `seekTo` e sincronização de tempo.
- Transcrição com busca, highlight, segmento ativo, cópia e exportações.
- Abas mobile do workspace e biblioteca local com busca/exclusão.

## Resultado

| Severidade | Achado | Resolução |
| --- | --- | --- |
| High | `setInterval` do player podia vazar após destroy/`videoId` exchange. | Corrigido: `cancelled` + `pollTimerRef` limpam o timer mesmo se `onReady` chegar depois do cleanup. |
| Medium | Seek atualizava `currentTime` mesmo com player ainda não pronto. | Corrigido: `seekTo` retorna `boolean` e só então atualiza o destaque. |
| Medium | Copiar transcrição sem tratamento de erro da Clipboard API. | Corrigido: `try/catch` com feedback de falha. |
| Low | Abas mobile sem semântica ARIA. | Corrigido: `tablist`/`tab`/`tabpanel` com `aria-selected` e ids associados. |

## Verificações

- `npm test` — 48 testes aprovados.
- `npm run lint` — aprovado.
- `npm run build` — aprovado.
- `npm audit --omit=dev` — sem vulnerabilidades de produção.
- Delta pós-correção revisado: aprovado, sem novos achados bloqueantes.

## Risco residual aceito

O player depende da YouTube IFrame API carregada no navegador; não há teste automatizado de integração com o iframe real neste ambiente. A busca destaca apenas a primeira ocorrência por segmento.

## Decisões

Não houve decisão arquitetural irreversível que exija ADR. O chat permanece placeholder até a W06.
