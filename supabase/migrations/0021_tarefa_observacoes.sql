-- Observações por tarefa do checklist — histórico de anotações (não um
-- campo único), visto pelo "+" ao lado do agendamento na tarefa.
create table processo_tarefa_observacoes (
  id uuid primary key default gen_random_uuid(),
  tarefa_id uuid not null references processo_tarefas(id) on delete cascade,
  texto text not null,
  autor_id uuid references pessoas(id),
  created_at timestamptz not null default now()
);
create index idx_processo_tarefa_observacoes_tarefa on processo_tarefa_observacoes(tarefa_id);

alter table processo_tarefa_observacoes enable row level security;

create policy processo_tarefa_observacoes_select on processo_tarefa_observacoes
  for select using (is_authorized());
create policy processo_tarefa_observacoes_write on processo_tarefa_observacoes
  for insert with check (is_authorized());
create policy processo_tarefa_observacoes_delete on processo_tarefa_observacoes
  for delete using (is_admin());
