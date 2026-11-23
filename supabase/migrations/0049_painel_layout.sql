-- Ordem personalizada dos widgets do Painel. Pedido do Caio: um modo
-- "Editar" onde os widgets balançam (como ícones de app no iPhone) e podem
-- ser arrastados pra reorganizar a tela — com a ordem salva na conta
-- (vale em qualquer dispositivo que ele acessar), não só neste navegador.
--
-- Uma linha por pessoa, com a ordem inteira guardada como array JSON de
-- IDs de widget (strings fixas definidas em
-- app/dashboard/painel-dashboard.tsx — "kpis", "agenda", etc.). Sobrescrita
-- inteira a cada reorganização, não precisa de granularidade por item.
-- Mesmo padrão de RLS "só a própria pessoa lê/escreve a própria linha" já
-- usado em push_subscriptions (0027_push_lembretes.sql).

create table painel_layout (
  pessoa_id uuid primary key references pessoas(id) on delete cascade,
  ordem_widgets jsonb not null default '[]'::jsonb,
  atualizado_em timestamptz not null default now()
);

alter table painel_layout enable row level security;

create policy painel_layout_select on painel_layout for select using (
  pessoa_id in (select id from pessoas where auth_user_id = auth.uid())
);
create policy painel_layout_insert on painel_layout for insert with check (
  pessoa_id in (select id from pessoas where auth_user_id = auth.uid())
);
create policy painel_layout_update on painel_layout for update using (
  pessoa_id in (select id from pessoas where auth_user_id = auth.uid())
);
create policy painel_layout_delete on painel_layout for delete using (
  pessoa_id in (select id from pessoas where auth_user_id = auth.uid())
);
