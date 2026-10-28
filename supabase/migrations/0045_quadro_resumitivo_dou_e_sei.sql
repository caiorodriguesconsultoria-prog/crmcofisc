-- Pregão, Ata de Registro de Preços e Contrato podem cada um ser publicados
-- no D.O.U, no PNCP, nos dois ou em nenhum (não é obrigatório) — espelha a
-- estrutura que a migração 0044 já criou pro PNCP, agora pro D.O.U também.
-- "_sei" guarda o número do documento SEI de cada publicação/número, pra
-- exibir "valor (nº SEI)" no Quadro Resumitivo, igual ao documento original.
alter table processos add column if not exists publicacao_dou_pregao text;
alter table processos add column if not exists publicacao_dou_pregao_sei text;
alter table processos add column if not exists publicacao_dou_ata text;
alter table processos add column if not exists publicacao_dou_ata_sei text;
alter table processos add column if not exists publicacao_dou_sei text;

alter table processos add column if not exists publicacao_pncp_pregao_sei text;
alter table processos add column if not exists publicacao_pncp_ata_sei text;
alter table processos add column if not exists publicacao_pncp_sei text;

alter table processos add column if not exists pregao_eletronico_numero_sei text;
alter table processos add column if not exists ata_registro_precos_numero_sei text;
alter table processos add column if not exists numero_contrato_sei text;
