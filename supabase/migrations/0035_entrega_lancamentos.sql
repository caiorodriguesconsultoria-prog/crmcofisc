-- Lançamentos de entrega (parcial ou total), com quantidades acumuláveis
-- de normal/avaria/desvio de qualidade numa mesma entrega. Ligado à parcela
-- do Cronograma (execucao_id) OU a uma linha da Pauta de Distribuição
-- (pauta_id) — nunca os dois.
create table processo_entrega_lancamentos (
  id uuid primary key default gen_random_uuid(),
  execucao_id uuid references processo_execucoes(id) on delete cascade,
  pauta_id uuid references processo_pauta_distribuicao(id) on delete cascade,
  quantidade_normal numeric(14,3) not null default 0,
  quantidade_avaria numeric(14,3) not null default 0,
  quantidade_desvio numeric(14,3) not null default 0,
  data_entrega date not null,
  nup text, -- manual; só usado nos lançamentos de Pauta (estados)
  created_at timestamptz not null default now(),
  constraint chk_um_vinculo check ((execucao_id is not null) <> (pauta_id is not null))
);
create index idx_entrega_lanc_execucao on processo_entrega_lancamentos(execucao_id);
create index idx_entrega_lanc_pauta on processo_entrega_lancamentos(pauta_id);
alter table processo_entrega_lancamentos enable row level security;
create policy processo_entrega_lanc_all on processo_entrega_lancamentos
  for all using (is_authorized()) with check (is_authorized());

-- processo_nups precisa parar de exigir só 1 NUP de "entrega" por parcela
-- (agora pode ter 1 por lançamento) — troca a constraint antiga por uma
-- nova ligada ao lançamento específico.
alter table processo_nups add column lancamento_id uuid references processo_entrega_lancamentos(id) on delete cascade;
drop index idx_processo_nups_execucao_tipo;
create unique index idx_processo_nups_execucao_tipo on processo_nups(execucao_id, tipo)
  where execucao_id is not null and tipo <> 'entrega';
create unique index idx_processo_nups_lancamento on processo_nups(lancamento_id)
  where lancamento_id is not null;
