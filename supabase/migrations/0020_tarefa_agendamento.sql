-- Agendamento (data + horário) por tarefa do checklist de evento — pra
-- Caio poder marcar "colher amostra dia 10 às 14h" direto na tarefa, em vez
-- de um agendamento solto. Aparece no Kanban/Lista/Agenda enquanto a tarefa
-- não for concluída; ao concluir, some das agendas (inclusive do Google,
-- que só reflete o que a .ics ainda exporta).
alter table processo_tarefas add column if not exists agendamento_data date;
alter table processo_tarefas add column if not exists agendamento_horario time;
