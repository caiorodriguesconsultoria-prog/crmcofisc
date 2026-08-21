-- Etapa "Relatório" (1/6): Quadro resumitivo.
-- A maioria dos ~24 campos do quadro já existe (migração 0010, ou desde a 0001).
-- Faltam só estes 2, que o protótipo mostra mas nunca tiveram coluna própria:

alter table processos add column quantidade_contratada text;
alter table processos add column data_assinatura date;
