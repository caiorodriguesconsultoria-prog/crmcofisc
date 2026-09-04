-- Etapa "Relatório" (2/6, ajuste): data real de entrega por parcela do cronograma,
-- pra calcular atraso (data_entrega - data_prevista) automaticamente na tela.

alter table processo_execucoes add column data_entrega date;
