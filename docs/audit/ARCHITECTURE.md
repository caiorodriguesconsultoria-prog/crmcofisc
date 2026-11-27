# Arquitetura — CRM-COFISC (AS-IS)

> Auditoria read-only de `origin/main` (produção — confirmado via Vercel: deploy atual `0efae14`, ver `STATUS.md`). Camada visual (Liquid Glass/`design-lab`) já documentada em `docs/design/` — referenciada aqui, não repetida.

## Stack

| Camada | Tecnologia | Observação |
|---|---|---|
| Framework | Next.js ^15.5.28 (App Router), React 18.3, TypeScript ^5.5 (strict) | |
| Banco/Auth | Supabase (`@supabase/ssr` ^0.12.7 + `@supabase/supabase-js` ^2.118.0) — Postgres + Auth + RLS | Sem uso de Supabase Storage (nenhuma chamada `supabase.storage` encontrada) |
| IA | `@anthropic-ai/sdk` ^0.122.0 — único provedor de IA | Ver `AI.md` |
| Observabilidade | `@sentry/nextjs` ^10.76.2 (`tracesSampleRate: 0` — só erros, sem tracing de performance) | |
| Notificações | `web-push` ^3.6.7 (VAPID) | |
| Planilhas | `xlsx` ^0.18.5 — só para leitura de anexo em extração por IA, sem exportação | |
| UI (compartilhada com `/design-lab`) | `framer-motion`, `lucide-react`, `recharts`, `@number-flow/react`, `@paper-design/shaders-react` | Ver `docs/design/` |
| Hospedagem | Vercel (região `pdx1`), 2 cron jobs diários | `vercel.json` |

## Autenticação e sessão

`middleware.ts` → `lib/supabase/middleware.ts::updateSession()` roda em toda requisição (exclui assets estáticos). Valida sessão via `getClaims()` (cache JWKS, sem round-trip), limpa cookies `sb-*-auth-token` em token inválido.

Três variantes de cliente Supabase:
- `lib/supabase/client.ts` — browser.
- `lib/supabase/server.ts` — RSC, vinculado a cookies, respeita RLS como o usuário logado.
- `lib/supabase/service.ts` — chave service-role, **ignora RLS** — usado só em contexto de cron/serviço: `lib/alerta-erro.ts`, `lib/dados-referencia.ts`, `lib/google-calendar.ts`, `app/api/status`, `app/api/push/verificar-lembretes`, `app/api/agenda.ics`.

## Mapa de rotas (`app/`)

| Rota | O que é |
|---|---|
| `dashboard` | Painel principal (KPIs/widgets), via `painel-dashboard.tsx`; layout arrastável (tabela `painel_layout`) |
| `processos` | Lista/Kanban/por-prazo de contratos — ver `FEATURES.md` |
| `processos/[id]` | Detalhe do contrato — ver `FEATURES.md` |
| `processos/novo`, `processos/concluidos` | Criação e lista de concluídos |
| `fornecedores`, `gestores`, `fiscais`, `coordenacoes`, `tags` | Cadastros mestres (gestores/fiscais compartilham `app/_pessoas-papel/lista.tsx`) |
| `agenda` | UI do feed `.ics` |
| `avisos` | Lista de alertas do sistema (`alertas_sistema`) |
| `dados` | Visão agregada entre contratos |
| `assistente` | Chat de IA (`chat.tsx` + streaming via `/api/assistente`) |
| `login`, `logout`, `auth/callback` | Autenticação Supabase (e-mail+senha e Google OAuth) |
| `privacidade` | Política de privacidade estática (exigida pela verificação OAuth do Google) |
| `design-lab`, `exemplo*` | Protótipo/laboratório — **já documentado em `docs/design/`**, não repetido aqui |
| `@modal/(.)processos` | Rota paralela/interceptadora do Next.js — modal de visualização rápida do contrato a partir da lista |

## `lib/` — responsabilidades

| Arquivo | Exporta | Responsabilidade |
|---|---|---|
| `alerta-erro.ts` | `notificarErroAdmins` | Registra em `alertas_sistema` + push para admins em qualquer erro capturado |
| `ausencia.ts` | `estaAusente`, `periodoAusencia` | Lógica pura de intervalo de ausência de pessoa |
| `contexto-barra-topo.ts` | `getContextoBarraTopo` | Dados compartilhados do cabeçalho (contagem de contratos ativos, agenda de hoje, iniciais do usuário) |
| `cor-etapa.ts`, `cores-evento.ts` | `corEtapa`, `corEvento` | Mapeamento determinístico de cor (etapa Kanban / tag de evento por hash) |
| `dados-referencia.ts` | `getPessoasAtivas`, `getPapeisGestorFiscal`, `getTagsEvento`, `getResponsaveis`, `getEtapasKanban` | Lookups de referência com `unstable_cache` (60s), via cliente service (ignora RLS — justificado por não ser dado sensível por usuário) |
| `entregas-derivados.ts` | `calcularTranscurso`, `calcularDerivadosEntregas` | Cálculo de atraso/percentual de prazo de validade/quantidade faltante — **fonte única**, comentário no próprio arquivo avisa contra duplicação |
| `estados-br.ts` | `siglaUf` (+ tabela de UFs) | Normaliza nome↔sigla de estado |
| `extenso.ts` | número→extenso (pt-BR) | Usado em texto formal de documento/relatório |
| `google-calendar.ts` | `googleConectado`, `criarOuAtualizarEventoGoogle`, `removerEventoGoogle`, `criarOuAtualizarTarefaGoogle`, `removerTarefaGoogle`, `marcarConclusaoTarefaGoogle`, `sincronizarPrazosGoogleTasks` | Integração completa Google Calendar+Tasks, token OAuth único compartilhado (`google_calendar_tokens`, linha singleton id=1) |
| `google-sync-cliente.ts` | `sincronizarGoogle` | Wrapper client-side fire-and-forget chamando `/api/google/sync` — falha nunca bloqueia o salvamento principal |
| `ia-anexo.ts` | `construirBlocoAnexo`, `extrairTextoResposta`, `tipoAnexoValido`, `TAMANHO_MAXIMO_ANEXO_BYTES` (4MB), `TIPOS_ACEITOS_ANEXO` | Conversão compartilhada de anexo→bloco de conteúdo Anthropic para os 3 endpoints de extração |
| `moeda.ts` | máscara/parse de BRL | |
| `numero-contrato.ts` | `numeroContratoSemSei` | Remove sufixo "(número SEI)" em contextos de exibição |
| `push.ts` | `enviarPush` | Wrapper fino sobre `web-push`, chaves VAPID via env |
| `relatorio-status.ts` | `relatorioDesatualizado`, `LIMITE_DIAS_RELATORIO=10` | Regra única, reusada em Contratos, assistente de IA e Painel (comentário no arquivo nota que já esteve duplicada) |
| `status-entrega.ts` | `statusParcela`, `statusContrato`, `execucaoFisica`, `resumoEntregas`, `gradienteOuSolido` | **Motor central de regra de negócio** para status de parcela/contrato — calculado, não armazenado (ver nota em `DATA_MODEL.md`) |
| `verificar-pessoa-duplicada.ts` | `buscarPessoaDuplicada`, `verificarPessoaDuplicada`, `garantirPessoaComPapel` | Deduplicação por nome/matrícula antes de inserir `pessoas` |
| `theme.ts` | tokens de design | **Compartilhado com `/design-lab`** — já documentado em `docs/design/DESIGN_SYSTEM.md` |

## `app/api/` — rotas

| Rota | Métodos | Função | Autenticação |
|---|---|---|---|
| `agenda.ics` | GET | Feed `.ics` público de `processo_agendamentos` (prazos/tarefas ficam de fora de propósito, roteados pro Google Tasks pra evitar duplicar entrada no Google) | Token por query string (`AGENDA_ICS_TOKEN`), não sessão |
| `ai/reformular-andamento` | POST | Reescreve texto informal de andamento formalmente (Claude Haiku 4.5) | Sessão |
| `assistente` | POST | Chat em streaming (Claude Opus 5.5) + 1 ferramenta (`historico_contrato`), executa SQL com o cliente da **própria sessão do usuário** — RLS aplica por usuário, não é backdoor privilegiado | Sessão |
| `erro/notificar` | POST | Reporte de erro do lado do cliente (erros de navegador não chegam no `onRequestError` do servidor) | Sessão |
| `google/auth`, `google/callback` | GET | OAuth Google Calendar+Tasks (iniciado só por admin) | Sessão + `is_admin` |
| `google/drive-auth`, `google/drive-callback` | GET | Fluxo OAuth separado, único/manual, pra gerar um refresh token consumido pelo script de backup do GitHub Actions (não usado em runtime pelo app) | Sessão + `is_admin` |
| `google/sync` | POST | Relay servidor: cria/atualiza/remove evento ou tarefa do Google | Interno (chamado por `google-sync-cliente.ts`) |
| `processos/extrair-pdf`, `extrair-pauta`, `extrair-entregas` | POST | 3 endpoints de extração por IA (Claude Haiku 4.5) → JSON estruturado para os formulários de Quadro Resumitivo/Pauta/Dados de entrega | Sessão |
| `push/inscrever` | POST, DELETE | Registra/remove inscrição push, vinculada à `pessoas` do usuário | Sessão |
| `push/verificar-lembretes` | GET, POST | **Cron** (2×/dia) — envia lembretes push agrupados das tarefas de hoje não notificadas + dispara `sincronizarPrazosGoogleTasks` | `CRON_SECRET` |
| `status` | GET | Health check público (só conectividade com o banco); tem chave de teste `FORCAR_FALHA_STATUS` que propositalmente pula o alerta push interno | Nenhuma |

## Infraestrutura não visível em `app/`

`.github/workflows/backup-diario.yml` — backup diário (06:00 UTC) via `pg_dump` completo do banco Supabase, mantido como artefato do GitHub Actions (90 dias) **e** enviado ao Google Drive (`scripts/backup_para_drive.py`, token OAuth gerado uma vez via `/api/google/drive-auth`, limpeza de 90 dias também no Drive). Mecanismo de recuperação de desastre real, só descobrível fora da árvore do app Next.js.

## Variáveis de ambiente referenciadas no código (nomes apenas — nenhum valor exposto)

`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `AGENDA_ICS_TOKEN`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `ANTHROPIC_API_KEY`, `CRON_SECRET`, `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY`/`VAPID_CONTATO_EMAIL`, `NEXT_PUBLIC_SENTRY_DSN`, `FORCAR_FALHA_STATUS` (só teste); no GitHub Actions: `SUPABASE_DB_URL`, `GOOGLE_DRIVE_REFRESH_TOKEN`, `GOOGLE_DRIVE_FOLDER_ID`.

**Gap**: `.env.example` não lista `ANTHROPIC_API_KEY`, `CRON_SECRET`, as chaves VAPID nem `AGENDA_ICS_TOKEN` — incompleto frente ao uso real (risco de onboarding, não de segurança, já que nenhum segredo é exposto). Ver `GAPS.md`.

## Duplicação/isolamento identificados

1. Duas noções paralelas de "status de parcela": a coluna armazenada `processo_execucoes.situacao` (ainda escrita por `app/processos/[id]/cronograma.tsx`) vs. a função calculada `lib/status-entrega.ts::statusParcela()` (usada em card/Dashboard/assistente de IA). Vale confirmar com Caio se a coluna armazenada ainda é autoritativa pra algo ou é resquício de antes do modelo calculado existir.
2. `lib/status-entrega.ts` assume, no próprio comentário, que duplica (não importa) parte da lógica de data/quantidade de `app/processos/[id]/cronograma.tsx` de propósito (separação cliente/servidor) — o próprio código avisa: "precisa espelhar mudanças nos dois lugares".
3. `.env.example` desatualizado (ver acima).
