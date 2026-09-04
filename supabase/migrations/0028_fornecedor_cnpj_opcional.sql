-- CNPJ deixa de ser obrigatório no cadastro de fornecedor — trava o fluxo
-- de abertura de processo quando ainda não se tem esse dado em mãos.
-- Continua único quando preenchido (múltiplos NULL são permitidos num
-- índice único no Postgres, não conflitam entre si).
alter table fornecedores alter column cnpj drop not null;
