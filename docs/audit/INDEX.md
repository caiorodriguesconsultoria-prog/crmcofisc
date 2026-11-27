# Auditoria AS-IS — CRM-COFISC

Mapa da documentação gerada em `docs/audit/`. Auditoria read-only: nenhum código, dado ou configuração foi alterado. Escopo e método completos em `STATUS.md`.

| Documento | Conteúdo |
|---|---|
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | Stack, estrutura de pastas, rotas de API, variáveis de ambiente, infraestrutura (backup, cron) |
| [`DATA_MODEL.md`](DATA_MODEL.md) | Todas as tabelas (reconstruídas das 50 migrações), relacionamentos, RLS |
| [`FEATURES.md`](FEATURES.md) | Toda tela, campo e ação — classificadas operacional/parcial/inexistente |
| [`BUSINESS_RULES.md`](BUSINESS_RULES.md) | Cálculos de status/atraso/execução, prazos, validações, exceções |
| [`WORKFLOWS.md`](WORKFLOWS.md) | Crons, gatilhos de banco, automações, fan-out de erro |
| [`AI.md`](AI.md) | 5 pontos de uso da API Anthropic — modelos, prompts, extração, limitações |
| [`DOCUMENTS.md`](DOCUMENTS.md) | Geração do relatório (HTML+impressão, não PDF servidor), referências SEI |
| [`INTEGRATIONS.md`](INTEGRATIONS.md) | Google Calendar/Tasks/Drive, Web Push, Sentry, monitor de uptime, `.ics` |
| [`UI_UX.md`](UI_UX.md) | Sistema visual real de produção, relação com `/design-lab`, achado de divergência |
| [`SKILLS.md`](SKILLS.md) | Skills/MCPs do ambiente Claude Code — utilidade e possíveis redundâncias |
| [`TESTS.md`](TESTS.md) | Cobertura (zero automatizada), CI existente, limitações desta própria auditoria |
| [`GAPS.md`](GAPS.md) | Consolidado de lacunas, riscos, débito técnico e dado inconsistente |
| [`STATUS.md`](STATUS.md) | Branch, commits, versões, estado real do deploy de produção (via Vercel) |
| [`BRANCH_SYNC.md`](BRANCH_SYNC.md) | Análise da divergência `origin/main`×branch de trabalho — classificação de commits, conflitos/regressões, backups, plano de integração segura |

## Como ler

- Para "o que existe hoje de verdade": comece por `FEATURES.md` + `BUSINESS_RULES.md`.
- Para "como o dado está estruturado": `DATA_MODEL.md`.
- Para "o que falta ou está arriscado": `GAPS.md` (consolida todos os outros documentos).
- Para "o que está realmente em produção neste momento": `STATUS.md` — contém um achado importante sobre divergência entre a branch de trabalho e o deploy real.

## Documentação já existente, não repetida aqui

- `docs/design/` — protótipo visual `/design-lab` (10 etapas + homologação), já cobre design system, componentes, testes visuais/desempenho e plano de migração daquele protótipo.
- `design-system/REGRAS.md` / `LIQUID_GLASS.md` — os dois sistemas visuais do produto.
- `LOG.md` — histórico cronológico de decisões de todo o projeto, desde a Etapa 1.
- `CLAUDE.md` — convenções operacionais do projeto.

## Regras seguidas nesta auditoria

Comportamento real referenciado por arquivo/função; funcionalidades diferenciadas por nível de completude; dado duplicado/isolado/inconsistente identificado; nenhuma credencial ou dado institucional exposto; nenhuma instalação, implementação, migração ou publicação realizada.
