-- Guarda o id da Google Task correspondente ao prazo do contrato, pra saber
-- qual atualizar/remover na sincronização periódica (prazo não tem tela de
-- edição no CRM, então não dá pra sincronizar na hora como agendamento e
-- tarefa — a sincronização roda junto com a rotina de lembrete, 2x por dia).
alter table processos add column if not exists prazo_google_task_id text;
