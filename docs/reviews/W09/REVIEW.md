# Revisão independente — W09 Polish

Data: 2026-10-02

## Escopo revisado

- Tema claro/escuro/sistema com bootstrap anti-FOUC e `ThemeSync`.
- Aparência em Configurações, skip link, focus-visible, Escape no chat.
- Teste de provedor de chat, StatusMessage, a11y de abas/segmentos e nav responsiva.

## Resultado

| Severidade | Achado | Resolução |
| --- | --- | --- |
| Medium | Bootstrap lia `theme` de settings inválidos e divergia do migrate. | Corrigido: só confia no theme se o blob parece settings válido; senão `system`. |
| Medium | Escape limpava UI do teste sem abortar o fetch. | Corrigido: `AbortController` + ignore de conclusão após abort. |

## Verificações

- `npm test` — 68 testes aprovados.
- `npm run lint` — aprovado.
- `npm run build` — aprovado.
- `npm audit --omit=dev` — sem vulnerabilidades de produção.
- Bugbot (branch changes) — achados medium tratados; delta pós-correção sem bloqueantes novos.

## Risco residual aceito

Teste de provedor consome uma chamada real à API do usuário. Tema `system` depende de `matchMedia` do navegador. Validação estrutural do bootstrap é mais permissiva que o Zod completo, mas evita o flip mais comum.

## Decisões

Não houve ADR. Com a Fase 9, o plano MVP (W01–W09) fica completo no código.
