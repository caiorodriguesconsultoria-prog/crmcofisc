# Testes — CRM-COFISC (AS-IS)

## Cobertura automatizada: inexistente

Nenhum arquivo `*.test.ts(x)`/`*.spec.ts(x)` no repositório. `package.json` não declara `test` em `scripts`, nem Jest/Vitest/Playwright/Testing Library como dependência. **Não há suíte de testes automatizados para o CRM** (distinto do protótipo `/design-lab`, que tem sua própria rodada de testes Playwright documentada em `docs/design/TESTS.md` — ali é verificação visual/funcional do laboratório de design, não teste automatizado do produto).

## CI/CD

`.github/workflows/`:
- `dependabot.yml` — atualização automática de dependências (não é teste).
- `backup-diario.yml` — cron de backup do banco (ver `WORKFLOWS.md`/`INTEGRATIONS.md`), não executa nenhum teste antes/depois.

**Não existe workflow de CI que rode `tsc`/`build`/lint automaticamente em push ou PR.** A disciplina de rodar `tsc --noEmit`/`npm run build` antes de cada commit é um processo manual seguido por quem desenvolve (documentado em `CLAUDE.md`/`LOG.md`), não imposta por automação.

## O que existe como verificação

- `npm run lint` (ESLint via `next lint`) — disponível, não confirmado se roda em algum gatilho automático.
- Testes manuais documentados em `LOG.md` ao longo do histórico do projeto — qualitativos, por rodada de mudança, não repetíveis automaticamente.
- `sql/auditoria_rls.sql`, `sql/verificar_migracao_0035.sql` — scripts de verificação manual de schema/RLS, rodados sob demanda no SQL Editor do Supabase, não em CI.

## Limitações desta auditoria

Esta auditoria foi **documental** (leitura de código/schema), não **funcional** — nenhuma tela foi executada, nenhum dado real foi consultado em runtime, nenhum teste foi escrito ou rodado. Achados de "operacional"/"parcial"/"inexistente" em `FEATURES.md` vêm de leitura de código (presença de lógica real vs. placeholder/TODO/condicional), não de execução observada. Recomendação: antes de qualquer decisão de produto baseada nesta auditoria, confirmar os achados mais sensíveis (ex. Google Calendar "condicionalmente inativo", ausência de atomicidade na criação de contrato) com um teste manual guiado em ambiente real.

## Gap mais relevante para GAPS.md

Ausência total de testes automatizados é, pelo tamanho e complexidade do domínio (Cronograma sozinho tem ~1500 linhas, regras de status com várias camadas de prioridade), o maior risco de regressão silenciosa do projeto — qualquer mudança em `lib/status-entrega.ts`, `lib/entregas-derivados.ts` ou `cronograma.tsx` depende inteiramente de teste manual pra não quebrar o cálculo de atraso/execução física que todo o resto do sistema (lista, Dashboard, assistente de IA, PDF) consome.
