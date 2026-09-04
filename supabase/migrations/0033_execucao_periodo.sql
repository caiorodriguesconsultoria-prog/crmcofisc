-- Cronograma de entregas (execuções) também passa a ter período (Manhã/Tarde)
-- junto da data prevista, no mesmo padrão das tarefas.
alter table processo_execucoes add column periodo text check (periodo in ('manha', 'tarde'));
