-- Rastreia quando o relatório de cada contrato foi marcado como atualizado
-- pela última vez, pra mostrar um alerta (verde/vermelho) na listagem de
-- contratos quando passar de 10 dias sem atualização.
alter table processos add column relatorio_atualizado_em timestamptz;
