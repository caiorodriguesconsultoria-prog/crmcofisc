-- Período de ausência de uma pessoa (ex.: fiscal afastado) — quando
-- preenchido, a pessoa ganha uma tag "Ausente" nas listas (Fiscais/Gestores)
-- e no quadro de Gestão e Fiscalização de cada contrato, servindo de aviso
-- pra não incluí-la em documento de assinatura enquanto durar o período.
alter table pessoas
  add column ausencia_inicio date,
  add column ausencia_fim date;
