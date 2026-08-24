create table coordenacao_contatos (
  id uuid primary key default gen_random_uuid(),
  coordenacao_id uuid not null references coordenacoes(id) on delete cascade,
  nome text not null,
  email text,
  ramal text,
  created_at timestamptz not null default now()
);

create index idx_coordenacao_contatos_coordenacao_id on coordenacao_contatos(coordenacao_id);

alter table coordenacao_contatos enable row level security;

create policy coordenacao_contatos_select on coordenacao_contatos
  for select using (is_authorized());
create policy coordenacao_contatos_insert on coordenacao_contatos
  for insert with check (is_admin());
create policy coordenacao_contatos_update on coordenacao_contatos
  for update using (is_admin());
create policy coordenacao_contatos_delete on coordenacao_contatos
  for delete using (is_admin());
