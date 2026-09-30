-- Pauta de distribuição (entrega por UF) ganha data de entrega e vínculo
-- com a parcela do Cronograma — antes era uma lista solta de UFs, sem
-- relação com nenhuma parcela nem data.
alter table processo_pauta_distribuicao add column data_entrega date;
alter table processo_pauta_distribuicao add column execucao_id uuid references processo_execucoes(id) on delete set null;
-- on delete set null (não cascade): apagar uma parcela do Cronograma não
-- pode apagar quantidade já distribuída por UF, só desvincular.
create index idx_processo_pauta_execucao on processo_pauta_distribuicao(execucao_id);
