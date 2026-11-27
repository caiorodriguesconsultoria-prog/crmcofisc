# Eventos, tarefas, gatilhos e automações — CRM-COFISC (AS-IS)

## Sem gatilhos/funções a nível de banco (exceto os de histórico)

Varredura das 50 migrações por `CREATE TRIGGER`/`CREATE FUNCTION`: só os gatilhos de auditoria de histórico existem de fato — `registrar_kanban_historico()` e `registrar_tag_historico()` (migração `0008`), que gravam `processo_kanban_historico`/`processo_tag_historico` a cada mudança de etapa/tag. Fora isso, **toda automação vive em código de aplicação** (rotas de API + cron), não em Postgres — vale registrar como traço arquitetural.

`gerar_processo_tarefas()` (plpgsql) materializa `tarefas_padrao` em `processo_tarefas` por contrato — é uma função chamada pela aplicação, não um gatilho automático.

## Cron: lembretes push (2×/dia)

`vercel.json`: `0 11 * * *` e `0 17 * * *` UTC (08:00/14:00 Brasília) → `GET /api/push/verificar-lembretes`. Autenticado via `CRON_SECRET` (header injetado pela Vercel, ou `x-cron-secret` manual pra teste via curl). Agrupa todas as `processo_tarefas` de hoje, incompletas e ainda não notificadas, num **único** push por dispositivo (prévia do corpo limitada a 4 linhas + "e mais N..."), marca `lembrete_enviado=true` pra não notificar de novo na segunda rodada do dia (só um reagendamento manual reseta essa flag). A mesma chamada também roda `sincronizarPrazosGoogleTasks` — **único ponto de sincronização** mantendo o Google Tasks atualizado com os prazos do CRM (diferente de agendamentos/tarefas, que sincronizam imediatamente ao salvar via `/api/google/sync`).

## Cron: backup diário (GitHub Actions, não Vercel)

Ver `INTEGRATIONS.md` — totalmente externo ao app Next.js, só descobrível em `.github/workflows/backup-diario.yml` + `scripts/backup_para_drive.py`.

## Fan-out de erro → push pra admins

Qualquer exceção não capturada no servidor (`instrumentation.ts::onRequestError`) ou um reporte explícito do cliente (erro de navegador → `POST /api/erro/notificar`) → `lib/alerta-erro.ts::notificarErroAdmins` → grava uma linha em `alertas_sistema` (registro durável mesmo se o push falhar/ninguém estiver inscrito) → envia push pra toda `pessoas` com `is_admin=true AND ativo=true`, com try/catch por inscrição (uma inscrição morta não trava as outras).

## Sem transição automática de etapa/status

Não foi encontrada nenhuma lógica que avance `etapa_atual`/`situacao` automaticamente por data — mudanças de estágio e conclusão são sempre acionadas pelo usuário (botões como `concluir-contrato-botao.tsx`, seletor em `etapas.tsx`), nunca por um relógio/gatilho. Status de **parcela** (verde/amarelo/vermelho) é diferente: esse sim é recalculado automaticamente a cada carregamento, mas é um indicador visual derivado, não uma transição de estado persistida.

## Resumo de automações ativas

| Automação | Gatilho | O que faz |
|---|---|---|
| Lembretes de tarefa | Cron 2×/dia (Vercel) | Push agrupado + sync de prazos no Google Tasks |
| Backup de banco | Cron diário (GitHub Actions) | `pg_dump` → artefato GitHub (90d) + Google Drive (90d, com poda) |
| Alerta de erro → admins | Exceção de servidor ou reporte de cliente | Grava `alertas_sistema` + push pros admins |
| Sincronização de agendamento/tarefa → Google | Salvar no CRM (imediato, client-side) | Cria/atualiza/remove evento ou tarefa no Google |
| Histórico de etapa/tag | Mudança de `etapa_atual`/tag do contrato | Gatilho de banco grava linha de histórico |
