-- Lista de etapas do processo, independente do Kanban (processos.etapa_atual
-- continua sendo a etapa única que move o card no quadro — não é tocada
-- aqui). Cada contrato ganha sua própria lista de etapas, criadas na mão
-- (sem lista padrão automática, igual ao checklist de tarefas), cada uma
-- com nome, data opcional e estado de conclusão. Pedido do Caio: "várias
-- etapas por contrato, cada uma com data, como em tarefas".

create table processo_etapas (
  id uuid primary key default gen_random_uuid(),
  processo_id uuid not null references processos(id) on delete cascade,
  nome text not null,
  data date,
  ordem integer not null,
  concluida boolean not null default false,
  concluida_em timestamptz,
  created_at timestamptz not null default now()
);
create index idx_processo_etapas_processo on processo_etapas(processo_id);

alter table processo_etapas enable row level security;

create policy processo_etapas_select on processo_etapas for select using (is_authorized());
create policy processo_etapas_write on processo_etapas for insert with check (is_authorized());
create policy processo_etapas_update on processo_etapas for update using (is_authorized());
create policy processo_etapas_delete on processo_etapas for delete using (is_admin());
