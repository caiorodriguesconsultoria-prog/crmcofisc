-- Tags de evento em tarefas do checklist — mesmo padrão de andamento_tags
-- (migração 0023), aplicado agora em processo_tarefas. Pedido do Caio:
-- marcar tag(s) de evento numa tarefa criada na mão (fora de um grupo de
-- evento específico), aparecendo coladas antes do texto da tarefa.

create table tarefa_tags (
  tarefa_id uuid not null references processo_tarefas(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  primary key (tarefa_id, tag_id)
);
create index idx_tarefa_tags_tarefa on tarefa_tags(tarefa_id);

alter table tarefa_tags enable row level security;
create policy tarefa_tags_select on tarefa_tags for select using (is_authorized());
create policy tarefa_tags_write on tarefa_tags for insert with check (is_authorized());
create policy tarefa_tags_delete on tarefa_tags for delete using (is_authorized());
