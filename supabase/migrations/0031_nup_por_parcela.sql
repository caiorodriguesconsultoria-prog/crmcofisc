-- NUP de Entrega e NUP de Pagamento por parcela do cronograma de entregas
-- (par criado junto, ligado à execução/parcela) — separado do NUP Relatório
-- geral, que continua como está.
alter table processo_nups add column execucao_id uuid references processo_execucoes(id) on delete cascade;

-- Pagamento não é obrigatório no momento da criação do par.
alter table processo_nups alter column nup drop not null;

alter table processo_nups drop constraint processo_nups_tipo_check;
alter table processo_nups add constraint processo_nups_tipo_check
  check (tipo in ('principal', 'relatorio', 'pagamento', 'entrega'));

-- No máximo um NUP de cada tipo por parcela.
create unique index idx_processo_nups_execucao_tipo on processo_nups(execucao_id, tipo)
  where execucao_id is not null;
