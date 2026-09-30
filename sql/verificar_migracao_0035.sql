-- Verifica se a migração 0035 (entregas parciais) já foi aplicada.
-- Só leitura, não altera nada.

select
  exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'processo_entrega_lancamentos'
  ) as tabela_lancamentos_existe,
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'processo_nups' and column_name = 'lancamento_id'
  ) as coluna_lancamento_id_existe;
