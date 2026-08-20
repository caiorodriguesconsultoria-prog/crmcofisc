-- CRM-COFISC — Etapa 4b: natureza_ocorrencia passa a aceitar múltiplos valores por processo
-- Rodar manualmente no SQL Editor, depois da etapa 4.

-- tag que faltava
insert into tags (categoria, valor)
select 'natureza_ocorrencia', 'Substituição de marca'
where not exists (
  select 1 from tags where categoria = 'natureza_ocorrencia' and valor = 'Substituição de marca'
);

-- tabela de relação processo <-> tags (permite N tags por processo, ex.: várias naturezas de ocorrência juntas)
create table processo_tags (
  id uuid primary key default gen_random_uuid(),
  processo_id uuid not null references processos(id) on delete cascade,
  tag_id uuid not null references tags(id),
  created_at timestamptz not null default now(),
  unique (processo_id, tag_id)
);
create index idx_processo_tags_processo on processo_tags(processo_id);
create index idx_processo_tags_tag on processo_tags(tag_id);

alter table processo_tags enable row level security;
create policy processo_tags_select on processo_tags for select using (is_authorized());
create policy processo_tags_write on processo_tags for insert with check (is_authorized());
create policy processo_tags_update on processo_tags for update using (is_authorized());
create policy processo_tags_delete on processo_tags for delete using (is_authorized());

-- remove a coluna antiga de valor único (natureza_ocorrencia agora vive em processo_tags)
alter table processos drop column natureza_ocorrencia_tag_id;
