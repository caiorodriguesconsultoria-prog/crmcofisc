-- Anexos em andamentos (ex.: ofício em PDF, foto de avaria). Bucket privado
-- no Storage — nunca público, acesso só via signed URL gerada sob demanda
-- pro time autenticado (mesmo padrão de acesso amplo já usado no resto do
-- sistema: qualquer pessoa ativa lê/anexa, remover é só admin).

insert into storage.buckets (id, name, public)
values ('andamento-anexos', 'andamento-anexos', false)
on conflict (id) do nothing;

create policy andamento_anexos_storage_select on storage.objects
  for select using (bucket_id = 'andamento-anexos' and is_authorized());
create policy andamento_anexos_storage_insert on storage.objects
  for insert with check (bucket_id = 'andamento-anexos' and is_authorized());
create policy andamento_anexos_storage_delete on storage.objects
  for delete using (bucket_id = 'andamento-anexos' and is_admin());

create table andamento_anexos (
  id uuid primary key default gen_random_uuid(),
  andamento_id uuid not null references andamentos(id) on delete cascade,
  nome_arquivo text not null,
  caminho text not null,
  tamanho_bytes bigint,
  tipo_mime text,
  autor_id uuid references pessoas(id),
  created_at timestamptz not null default now()
);
create index idx_andamento_anexos_andamento on andamento_anexos(andamento_id);

alter table andamento_anexos enable row level security;
create policy andamento_anexos_select on andamento_anexos for select using (is_authorized());
create policy andamento_anexos_write on andamento_anexos for insert with check (is_authorized());
create policy andamento_anexos_delete on andamento_anexos for delete using (is_admin());
