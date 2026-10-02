# Revisão independente — W08 Private YouTube

Data: 2026-10-02

## Escopo revisado

- Validação Netscape de `cookies.txt` (cliente/servidor sem Node no bundle do browser).
- Escrita temporária (`mode 0o600`), `--cookies` no yt-dlp e limpeza via job directory.
- Rotas `metadata`, `subtitles` e `transcription/start` com campo `cookies` opcional.
- Store só em memória + UI de upload em Configurações; import/workspace encaminham a sessão.

## Resultado

| Severidade | Achado | Resolução |
| --- | --- | --- |
| — | Nenhum achado bloqueante no Bugbot nem na revisão manual. | N/A |

## Verificações

- `npm test` — 66 testes aprovados.
- `npm run lint` — aprovado.
- `npm run build` — aprovado.
- `npm audit --omit=dev` — sem vulnerabilidades de produção.
- Bugbot (branch changes) — sem bugs.

## Risco residual aceito

Cookies trafegam no corpo JSON das APIs locais do Next.js (esperado para o MVP sem sessão server-side). Não há teste live contra um vídeo privado real neste ambiente. Formato Netscape inválido mas com tabs genéricas ainda pode passar a validação estrutural e falhar só no yt-dlp.

## Decisões

Cookies nunca entram no `settings` persistido nem em localStorage — store Zustand sem middleware de persistência. Auth por usuário/senha do YouTube permanece fora de escopo.
