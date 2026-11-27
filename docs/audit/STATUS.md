# Status — CRM-COFISC (AS-IS)

## Produção (confirmado via Vercel MCP, não suposição)

- **Projeto Vercel**: `crmcofisc` (`prj_FIGiBv2vDOUuFdcPYe9twW8s8QH7`)
- **Deploy de produção atual**: commit `0efae14` (branch `main` do GitHub), 2026-11-23 19:16 UTC — `"Merge branch 'claude/crm-cofisc-conexao-9pot1u' into _merge-to-main"`
- **Padrão de deploy observado**: produção publica a partir de `main`; `main` recebe código via merges periódicos de uma branch temporária `_merge-to-main` (criada a partir da branch de trabalho). Os últimos 3 deploys de produção listados pela API da Vercel seguem esse mesmo padrão de merge.

## Branches e divergência (achado relevante desta auditoria)

| Ref | Commits totais | Observação |
|---|---|---|
| `origin/main` (produção) | 420 | HEAD = `0efae14` |
| `claude/crm-cofisc-conexao-9pot1u` (branch de trabalho desta sessão) | — | HEAD = `2aa7038` (2026-11-27) |
| Só em `main`, ausentes na branch | 331 commits | Trabalho de produto feito por outros canais/sessões enquanto a branch de trabalho seguia isolada |
| Só na branch, ausentes em `main` | 38 commits | Ver detalhe abaixo |

Os 38 commits exclusivos da branch de trabalho se dividem em dois grupos:

1. **Protótipo e documentação, intencionalmente não publicados** (consistente com o plano "CRM Premium" registrado em `LOG.md`: "trabalhe em branch separada, não publique em produção sem aprovação"): todo o laboratório `/design-lab`, `docs/design/`, `design-system/LIQUID_GLASS.md`, `CRM_DESIGN.zip`.
2. **Mudanças de produto reais, não confirmadas como publicadas**: extração de `app/_ui/barra-lateral.tsx` (sidebar) + `controle-segmentado.tsx`, redesenho Liquid Glass da tela de login (`app/login/page.tsx`, `_fundo.tsx`), `lib/relatorio-status.ts` (novo), ajustes em `lib/status-entrega.ts` (função `execucaoFisica`), ajustes em `app/dashboard/*`, `app/processos/page.tsx`/`lista.tsx`/`[id]/abas.tsx`, `app/fiscais/page.tsx`/`app/gestores/page.tsx`, `app/api/assistente/route.ts`/`app/assistente/chat.tsx`.

**Implicação prática**: a documentação produzida anteriormente nesta mesma sessão (`app/design-lab/CONHECIMENTO.md`, `docs/design/COMPONENTS.md`) descreve `app/_ui/barra-lateral.tsx` como "já em produção" e trata o redesenho do login como publicado — **nenhum dos dois está confirmado no deploy de produção atual** (`0efae14`, ver acima). Recomenda-se tratar como pendente de confirmação com Caio, não como fato assentado. Ver `GAPS.md` e `UI_UX.md`.

## Versões

| Componente | Versão |
|---|---|
| Next.js | ^15.5.28 (App Router) |
| React | 18.3.0 |
| TypeScript | ^5.5.0 |
| `@supabase/supabase-js` | ^2.118.0 |
| `@anthropic-ai/sdk` | ^0.122.0 |
| `@sentry/nextjs` | ^10.76.2 |
| Migrações de banco | `0001` a `0050` (50 migrações, todas aditivas) |

## CI/CD

- `.github/workflows/dependabot.yml` — atualização automática de dependências.
- `.github/workflows/backup-diario.yml` — backup diário do banco (06:00 UTC), ver `WORKFLOWS.md`.
- **Nenhum workflow de verificação (`tsc`/`build`/lint) em push/PR** — ver `TESTS.md`.

## Esta auditoria

- **Tipo**: documental, read-only — nenhum arquivo de código/configuração/dado foi alterado.
- **Fonte**: `origin/main` para fatos de produção (schema, rotas, regras) + confirmação direta via Vercel MCP para o estado de deploy; a branch de trabalho local foi usada só como checkout de conveniência (idêntica a `main` em todos os arquivos não listados na seção de divergência acima).
- **Gerado em**: `docs/audit/` + `CRM_AUDIT.zip`, nesta mesma branch de trabalho — **não publicado, não mesclado a `main`**.
