-- Tarefas passam a ser agendadas por período (Manhã/Tarde) em vez de
-- horário exato — o horário nunca foi executado com precisão, só serve de
-- lembrete. agendamento_horario deixa de ser usado por tarefas (fica sem
-- uso, mas não é removido pra não quebrar histórico).
alter table processo_tarefas add column periodo text check (periodo in ('manha', 'tarde'));
