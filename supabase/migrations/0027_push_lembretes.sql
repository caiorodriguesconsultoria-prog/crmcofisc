-- Notificações push (Web Push): guarda a inscrição de cada aparelho que
-- autorizou notificação, e uma flag por agendamento/andamento/tarefa pra
-- não avisar duas vezes o mesmo compromisso.

create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  pessoa_id uuid not null references pessoas(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);
create index idx_push_subscriptions_pessoa on push_subscriptions(pessoa_id);

alter table push_subscriptions enable row level security;

create policy push_subscriptions_select on push_subscriptions for select using (
  pessoa_id in (select id from pessoas where auth_user_id = auth.uid())
);
create policy push_subscriptions_insert on push_subscriptions for insert with check (
  pessoa_id in (select id from pessoas where auth_user_id = auth.uid())
);
create policy push_subscriptions_delete on push_subscriptions for delete using (
  pessoa_id in (select id from pessoas where auth_user_id = auth.uid())
);

alter table processo_agendamentos add column lembrete_enviado boolean not null default false;
alter table andamentos add column lembrete_enviado boolean not null default false;
alter table processo_tarefas add column lembrete_enviado boolean not null default false;
