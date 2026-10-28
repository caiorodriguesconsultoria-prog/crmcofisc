-- O Quadro Resumitivo original tem 3 "Publicação PNCP" distintas (uma do
-- Pregão, uma da Ata de Registro de Preços, uma do Contrato) — o sistema só
-- tinha 1 campo (publicacao_pncp), que passa a ser especificamente a do
-- Contrato. Novas colunas pras outras duas.
alter table processos add column if not exists publicacao_pncp_pregao text;
alter table processos add column if not exists publicacao_pncp_ata text;
