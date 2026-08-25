-- Integração com Google Calendar (push via API, não mais só o feed .ics
-- passivo) — sincroniza na hora quando um agendamento é criado/editado/
-- removido/concluído.

-- Guarda o token de acesso da conta Google conectada (uma só, a de Caio).
-- RLS habilitado sem nenhuma policy = acesso negado a todo mundo exceto o
-- client de serviço (que ignora RLS) — só o servidor mexe nessa tabela,
-- nunca o navegador.
create table google_calendar_tokens (
  id int primary key default 1,
  refresh_token text not null,
  access_token text,
  access_token_expira_em timestamptz,
  updated_at timestamptz not null default now(),
  constraint google_calendar_tokens_singleton check (id = 1)
);
alter table google_calendar_tokens enable row level security;

-- Guarda o id do evento correspondente no Google, pra saber qual atualizar
-- ou remover depois.
alter table processo_agendamentos add column if not exists google_event_id text;
alter table processo_tarefas add column if not exists google_event_id text;
