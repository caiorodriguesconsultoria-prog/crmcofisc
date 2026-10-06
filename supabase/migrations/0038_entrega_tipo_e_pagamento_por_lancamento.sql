-- Cada lançamento de entrega (parcela do Cronograma) passa a ter um tipo:
-- "total" (fecha a parcela inteira numa entrega só), "parcial" (ainda vai
-- ter mais entregas depois) ou "avaria" (reposição de mercadoria avariada
-- de um lançamento total/parcial anterior — sempre referencia um "pai").
-- Avaria não entra na soma de "Falta" (a quantidade já foi contada no
-- lançamento original) e nunca tem NUP próprio (reusa o do lançamento pai).
alter table processo_entrega_lancamentos
  add column tipo text not null default 'parcial' check (tipo in ('total', 'parcial', 'avaria')),
  add column lancamento_pai_id uuid references processo_entrega_lancamentos(id) on delete cascade,
  add column data_limite date;

-- Reposição de avaria tem prazo (data_limite) como referência obrigatória,
-- mas pode não ter data_entrega ainda (só quando a reposição realmente
-- acontecer) — por isso data_entrega deixa de ser obrigatória no banco.
alter table processo_entrega_lancamentos alter column data_entrega drop not null;

alter table processo_entrega_lancamentos
  add constraint chk_avaria_tem_pai check (tipo <> 'avaria' or lancamento_pai_id is not null),
  add constraint chk_avaria_tem_prazo check (tipo <> 'avaria' or data_limite is not null);

create index idx_entrega_lanc_pai on processo_entrega_lancamentos(lancamento_pai_id);

-- NUP de Pagamento deixa de ser 1-por-parcela e passa a ser 1-por-lançamento,
-- igual ao NUP de Entrega (cada entrega parcial/total tem seu próprio par de
-- NUPs). Troca a constraint antiga (execucao_id, tipo) por uma só em cima do
-- lançamento, permitindo até 2 linhas por lançamento (uma de cada tipo).
drop index idx_processo_nups_execucao_tipo;
drop index idx_processo_nups_lancamento;
create unique index idx_processo_nups_lancamento_tipo on processo_nups(lancamento_id, tipo)
  where lancamento_id is not null;
