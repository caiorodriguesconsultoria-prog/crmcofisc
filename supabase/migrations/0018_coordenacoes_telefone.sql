-- Substitui a primeira versão desta migração (cadastro genérico de "contatos"),
-- nunca confirmada como executada: o formato certo, conforme o protótipo original,
-- é reaproveitar pessoa_papeis (papel = coordenador/substituto), não uma tabela nova.
drop table if exists coordenacao_contatos;

alter table coordenacoes add column if not exists telefone text;
