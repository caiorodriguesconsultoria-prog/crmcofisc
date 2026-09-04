-- Etapa "Relatório" (3/6): Execução do contrato.
-- Duas tabelas novas: pauta de distribuição por UF (entrega descentralizada) e
-- log de entregas realizadas (dados de entrega, campo a campo do protótipo).
-- "Forma de entrega: Descentralizada/Centralizada" do protótipo não vira coluna própria —
-- é derivado na tela (mais de 1 UF na pauta = descentralizada), evita campo redundante.

create table processo_pauta_distribuicao (
  id uuid primary key default gen_random_uuid(),
  processo_id uuid not null references processos(id) on delete cascade,
  uf text not null,
  quantidade numeric(14,3) not null,
  created_at timestamptz not null default now()
);
create index idx_processo_pauta_processo on processo_pauta_distribuicao(processo_id);

alter table processo_pauta_distribuicao enable row level security;

create policy processo_pauta_select on processo_pauta_distribuicao
  for select using (is_authorized());
create policy processo_pauta_write on processo_pauta_distribuicao
  for insert with check (is_authorized());
create policy processo_pauta_update on processo_pauta_distribuicao
  for update using (is_authorized());
create policy processo_pauta_delete on processo_pauta_distribuicao
  for delete using (is_authorized());

create table processo_entregas (
  id uuid primary key default gen_random_uuid(),
  processo_id uuid not null references processos(id) on delete cascade,
  local_entrega text,
  quantidade numeric(14,3),
  valor_total_nf numeric(14,2),
  danfe_venda text,
  danfe_remessa text,
  lote text,
  data_fabricacao date,
  data_validade date,
  data_entrega date,
  responsavel text,
  atraso_dias integer,
  percentual_transcurso numeric(5,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_processo_entregas_updated before update on processo_entregas
  for each row execute function set_updated_at();
create index idx_processo_entregas_processo on processo_entregas(processo_id);

alter table processo_entregas enable row level security;

create policy processo_entregas_select on processo_entregas
  for select using (is_authorized());
create policy processo_entregas_write on processo_entregas
  for insert with check (is_authorized());
create policy processo_entregas_update on processo_entregas
  for update using (is_authorized());
create policy processo_entregas_delete on processo_entregas
  for delete using (is_authorized());
