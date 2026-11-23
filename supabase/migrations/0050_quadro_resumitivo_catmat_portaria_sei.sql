-- Pedido do Caio: um campo pra CATMAT no Quadro Resumitivo (não existia em
-- `processos` — só em `processo_itens`, que é por item; esse aqui é um
-- campo simples de contrato, igual valor_global/valor_garantia) e o número
-- do documento SEI da Portaria Designação de Fiscal (mesmo padrão "_sei"
-- já usado em Pregão/Ata/Contrato desde a migração 0045).
alter table processos add column if not exists catmat text;
alter table processos add column if not exists portaria_designacao_fiscal_sei text;
