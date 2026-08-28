-- CRM-COFISC — Kanban ganha colunas dinâmicas (criar novas + reordenar, como no Trello)
-- Rodar manualmente no SQL Editor.
-- Hoje as 5 colunas do Kanban são uma lista fixa no código (app/kanban/page.tsx),
-- travada também por um CHECK em processos.etapa_atual. Essa migração move a lista
-- pro banco (com ordem) e libera o CHECK pra aceitar qualquer coluna cadastrada aqui.

create table kanban_colunas (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  ordem integer not null,
  created_at timestamptz not null default now()
);

insert into kanban_colunas (nome, ordem) values
  ('Ofício de apresentação', 0),
  ('Aguardando entrega', 1),
  ('Aguardando assinatura', 2),
  ('Aguardando pagamento', 3),
  ('Aguardando Área Técnica', 4);

alter table processos drop constraint processos_etapa_atual_check;

alter table kanban_colunas enable row level security;
create policy kanban_colunas_select on kanban_colunas for select using (is_authorized());
create policy kanban_colunas_insert on kanban_colunas for insert with check (is_authorized());
create policy kanban_colunas_update on kanban_colunas for update using (is_authorized());
create policy kanban_colunas_delete on kanban_colunas for delete using (is_admin());
