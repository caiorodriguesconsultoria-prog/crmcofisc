-- Coordenações: campo fixo do coordenador (nome + e-mail), separado da lista
-- de equipe. A lista de "responsáveis" (pessoa_papeis papel=coordenador/substituto)
-- vira "equipe" — não tem mais papel de coordenador/substituto dentro dela,
-- porque o coordenador agora é este campo único abaixo.
alter table coordenacoes add column if not exists coordenador_nome text;
alter table coordenacoes add column if not exists coordenador_email text;

alter table pessoa_papeis drop constraint if exists pessoa_papeis_papel_check;
alter table pessoa_papeis add constraint pessoa_papeis_papel_check
  check (papel in ('coordenador', 'substituto', 'gestor', 'fiscal', 'equipe'));
-- 'coordenador'/'substituto' continuam válidos só por compatibilidade com
-- registros já existentes — novos cadastros de equipe usam 'equipe'.

-- Agendamento de entrega (data + horário) por processo — conceito novo,
-- pra aparecer no card do Kanban, na coluna Etapa da lista de Processos e
-- na Agenda. Um processo pode ter mais de um horário agendado (ex.: setores
-- diferentes recebendo em horários diferentes no mesmo dia).
create table if not exists processo_agendamentos (
  id uuid primary key default gen_random_uuid(),
  processo_id uuid not null references processos(id) on delete cascade,
  data date not null,
  horario time not null,
  observacao text,
  created_at timestamptz not null default now()
);

create index if not exists processo_agendamentos_processo_id_idx on processo_agendamentos(processo_id);
create index if not exists processo_agendamentos_data_idx on processo_agendamentos(data);

alter table processo_agendamentos enable row level security;

create policy processo_agendamentos_select on processo_agendamentos
  for select using (is_authorized());
create policy processo_agendamentos_write on processo_agendamentos
  for insert with check (is_authorized());
create policy processo_agendamentos_update on processo_agendamentos
  for update using (is_authorized());
create policy processo_agendamentos_delete on processo_agendamentos
  for delete using (is_authorized());
