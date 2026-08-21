-- Campos do Relatório (Quadro resumitivo), gestor/fiscal vinculados ao
-- processo e cronograma de entregas (execuções).

alter table processos
  add column processo_eletronico_numero text,
  add column pregao_eletronico_numero text,
  add column ata_registro_precos_numero text,
  add column publicacao_dou text,
  add column publicacao_pncp text,
  add column valor_garantia numeric(14,2),
  add column portaria_designacao_fiscal text,
  add column nota_empenho_numero text,
  add column programa_trabalho text,
  add column natureza_despesa text,
  add column local_entrega text,
  add column prazo_data date,
  add column gestor_id uuid references pessoas(id),
  add column gestor_substituto_id uuid references pessoas(id),
  add column fiscal_id uuid references pessoas(id),
  add column fiscal_substituto_id uuid references pessoas(id);

-- Cronograma de entregas (1:N)
create table processo_execucoes (
  id uuid primary key default gen_random_uuid(),
  processo_id uuid not null references processos(id) on delete cascade,
  numero integer not null,
  quantidade numeric(14,3) not null,
  unidade text,
  data_prevista date,
  situacao text not null default 'pendente' check (situacao in (
    'pendente','em_transito','entregue','atrasada'
  )),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (processo_id, numero)
);
create trigger trg_processo_execucoes_updated before update on processo_execucoes
  for each row execute function set_updated_at();
create index idx_processo_execucoes_processo on processo_execucoes(processo_id);

alter table processo_execucoes enable row level security;

create policy processo_execucoes_select on processo_execucoes
  for select using (is_authorized());
create policy processo_execucoes_write on processo_execucoes
  for insert with check (is_authorized());
create policy processo_execucoes_update on processo_execucoes
  for update using (is_authorized());
create policy processo_execucoes_delete on processo_execucoes
  for delete using (is_authorized());
