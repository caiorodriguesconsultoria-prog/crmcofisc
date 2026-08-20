-- Checklist de tarefas: lista padrão por Kanban (etapa) ou Evento (tag),
-- copiada automaticamente pro processo a cada entrada na etapa / ativação
-- do evento (snapshot, não muda retroativamente se a lista padrão mudar).

create table tarefas_padrao (
  id uuid primary key default gen_random_uuid(),
  contexto text not null check (contexto in ('kanban','evento')),
  chave text not null,
  ordem integer not null,
  label text not null,
  ativo boolean not null default true,
  unique (contexto, chave, ordem)
);

create table processo_tarefas (
  id uuid primary key default gen_random_uuid(),
  processo_id uuid not null references processos(id) on delete cascade,
  origem_tipo text not null check (origem_tipo in ('kanban','evento')),
  origem_id uuid not null,
  ordem integer not null,
  label text not null,
  concluida boolean not null default false,
  concluida_em timestamptz,
  created_at timestamptz not null default now()
);
create index idx_processo_tarefas_processo on processo_tarefas(processo_id);
create index idx_processo_tarefas_origem on processo_tarefas(origem_tipo, origem_id);

alter table tarefas_padrao enable row level security;
alter table processo_tarefas enable row level security;

create policy tarefas_padrao_select on tarefas_padrao for select using (is_authorized());
create policy tarefas_padrao_write on tarefas_padrao for insert with check (is_admin());
create policy tarefas_padrao_update on tarefas_padrao for update using (is_admin());
create policy tarefas_padrao_delete on tarefas_padrao for delete using (is_admin());

create policy processo_tarefas_select on processo_tarefas for select using (is_authorized());
create policy processo_tarefas_write on processo_tarefas for insert with check (is_authorized());
create policy processo_tarefas_update on processo_tarefas for update using (is_authorized());
create policy processo_tarefas_delete on processo_tarefas for delete using (is_admin());

-- Gera o checklist do processo a partir da lista padrão (snapshot)
create or replace function gerar_processo_tarefas(
  p_processo_id uuid, p_contexto text, p_chave text, p_origem_id uuid
) returns void language plpgsql as $$
begin
  insert into processo_tarefas (processo_id, origem_tipo, origem_id, ordem, label)
  select p_processo_id, p_contexto, p_origem_id, ordem, label
  from tarefas_padrao
  where contexto = p_contexto and chave = p_chave and ativo = true
  order by ordem;
end;
$$;

-- Estende o trigger de histórico de kanban pra também gerar o checklist
create or replace function registrar_kanban_historico()
returns trigger language plpgsql as $$
declare
  v_historico_id uuid;
begin
  if TG_OP = 'INSERT' then
    insert into processo_kanban_historico (processo_id, kanban, entrada_em)
    values (new.id, new.etapa_atual, now())
    returning id into v_historico_id;
    perform gerar_processo_tarefas(new.id, 'kanban', new.etapa_atual, v_historico_id);
  elsif TG_OP = 'UPDATE' and new.etapa_atual is distinct from old.etapa_atual then
    update processo_kanban_historico set saida_em = now()
      where processo_id = new.id and saida_em is null;
    insert into processo_kanban_historico (processo_id, kanban, entrada_em)
    values (new.id, new.etapa_atual, now())
    returning id into v_historico_id;
    perform gerar_processo_tarefas(new.id, 'kanban', new.etapa_atual, v_historico_id);
  end if;
  return new;
end;
$$;

-- Estende o trigger de histórico de evento pra também gerar o checklist
create or replace function registrar_tag_historico()
returns trigger language plpgsql as $$
declare
  v_historico_id uuid;
  v_valor text;
begin
  if TG_OP = 'INSERT' then
    insert into processo_tag_historico (processo_id, tag_id, inicio_em)
    values (new.processo_id, new.tag_id, now())
    returning id into v_historico_id;
    select valor into v_valor from tags where id = new.tag_id;
    perform gerar_processo_tarefas(new.processo_id, 'evento', v_valor, v_historico_id);
  elsif TG_OP = 'DELETE' then
    update processo_tag_historico
      set fim_em = now()
      where processo_id = old.processo_id and tag_id = old.tag_id and fim_em is null;
  end if;
  return coalesce(new, old);
end;
$$;

-- Marcar uma tarefa como concluída gera um andamento automático
create or replace function registrar_tarefa_andamento()
returns trigger language plpgsql as $$
declare
  v_autor_id uuid;
begin
  if new.concluida = true and old.concluida = false then
    new.concluida_em := now();
    select id into v_autor_id from pessoas where auth_user_id = auth.uid();
    insert into andamentos (processo_id, tipo, texto, autor_id)
    values (new.processo_id, 'Tarefa concluída', new.label, v_autor_id);
  elsif new.concluida = false and old.concluida = true then
    new.concluida_em := null;
  end if;
  return new;
end;
$$;

create trigger trg_processo_tarefas_andamento
before update on processo_tarefas
for each row execute function registrar_tarefa_andamento();

-- Seed: tarefas padrão vindas do protótipo original
-- Kanban — só "Ofício de apresentação" tem lista definida no protótipo
insert into tarefas_padrao (contexto, chave, ordem, label) values
  ('kanban', 'Ofício de apresentação', 1, 'Colher dados do contrato'),
  ('kanban', 'Ofício de apresentação', 2, 'Criar ofício de apresentação'),
  ('kanban', 'Ofício de apresentação', 3, 'Enviar ofício para assinatura'),
  ('kanban', 'Ofício de apresentação', 4, 'Enviar ofício para contratada'),
  ('kanban', 'Ofício de apresentação', 5, 'Atualizar relatório');

-- Evento — Transcurso de validade (aplicado às duas tags de percentual)
insert into tarefas_padrao (contexto, chave, ordem, label)
select 'evento', chave, ordem, label from (values
  (1, 'Anexar cópia de Carta de Compromisso de Troca ao SEI'),
  (2, 'Enviar e-mail para análise da coordenação'),
  (3, 'Anexar resposta da Coordenação'),
  (4, 'Criar ofício de transcurso de validade/embalagem comercial'),
  (5, 'Criar ofício'),
  (6, 'Enviar ofício para assinatura'),
  (7, 'Enviar ofício para a contratada'),
  (8, 'Incluir informações sobre carta de compromisso na planilha do teams'),
  (9, 'Atualizar relatório')
) as t(ordem, label)
cross join (values ('Transcurso de validade - 40%'), ('Transcurso de validade - 30%')) as c(chave);

-- Evento — Embalagem Comercial
insert into tarefas_padrao (contexto, chave, ordem, label) values
  ('evento', 'Embalagem Comercial', 1, 'Anexar cópia de Carta de Compromisso de Troca ao SEI'),
  ('evento', 'Embalagem Comercial', 2, 'Enviar e-mail para análise da coordenação'),
  ('evento', 'Embalagem Comercial', 3, 'Anexar resposta da Coordenação'),
  ('evento', 'Embalagem Comercial', 4, 'Criar ofício de transcurso de validade/embalagem comercial'),
  ('evento', 'Embalagem Comercial', 5, 'Enviar ofício para a contratada'),
  ('evento', 'Embalagem Comercial', 6, 'Incluir informações sobre carta de compromisso na planilha do teams'),
  ('evento', 'Embalagem Comercial', 7, 'Atualizar relatório');

-- Evento — Avaria na Entrega
insert into tarefas_padrao (contexto, chave, ordem, label) values
  ('evento', 'Avaria na Entrega', 1, 'Consultar NUP de pagamento e conferir avaria'),
  ('evento', 'Avaria na Entrega', 2, 'Colher informações sobre avaria e alimentar sistema'),
  ('evento', 'Avaria na Entrega', 3, 'Criar ofício de avaria'),
  ('evento', 'Avaria na Entrega', 4, 'Enviar ofício para assinatura'),
  ('evento', 'Avaria na Entrega', 5, 'Enviar e-mail com ofício para a contratada'),
  ('evento', 'Avaria na Entrega', 6, 'Anexar ofício ao NUP de pagamento'),
  ('evento', 'Avaria na Entrega', 7, 'Anexar e-mail ao NUP de pagamento');

-- Evento — Atraso na entrega
insert into tarefas_padrao (contexto, chave, ordem, label) values
  ('evento', 'Atraso na entrega', 1, 'Conferir relatório de entregas'),
  ('evento', 'Atraso na entrega', 2, 'Conferir relatório de entregas junto à COAL'),
  ('evento', 'Atraso na entrega', 3, 'Criar ofício notificação de atraso na entrega'),
  ('evento', 'Atraso na entrega', 4, 'Enviar para assinatura'),
  ('evento', 'Atraso na entrega', 5, 'Enviar e-mail para contratada com ofício de notificação'),
  ('evento', 'Atraso na entrega', 6, 'Atualizar relatório');

-- Evento — Falta na Entrega
insert into tarefas_padrao (contexto, chave, ordem, label) values
  ('evento', 'Falta na Entrega', 1, 'Consultar NUP de pagamento e conferir avaria'),
  ('evento', 'Falta na Entrega', 2, 'Colher informações sobre avaria e alimentar sistema'),
  ('evento', 'Falta na Entrega', 3, 'Criar ofício de avaria'),
  ('evento', 'Falta na Entrega', 4, 'Enviar ofício para assinatura'),
  ('evento', 'Falta na Entrega', 5, 'Enviar e-mail com ofício para a contratada'),
  ('evento', 'Falta na Entrega', 6, 'Anexar ofício ao NUP de pagamento'),
  ('evento', 'Falta na Entrega', 7, 'Anexar e-mail ao NUP de pagamento');

-- Evento — Desvio de qualidade
insert into tarefas_padrao (contexto, chave, ordem, label) values
  ('evento', 'Desvio de qualidade', 1, 'Consultar NUP de pagamento e conferir avaria'),
  ('evento', 'Desvio de qualidade', 2, 'Colher informações sobre desvio de qualidade e alimentar sistema'),
  ('evento', 'Desvio de qualidade', 3, 'Criar ofício de desvio de qualidade'),
  ('evento', 'Desvio de qualidade', 4, 'Enviar ofício para assinatura'),
  ('evento', 'Desvio de qualidade', 5, 'Enviar e-mail com ofício para a contratada'),
  ('evento', 'Desvio de qualidade', 6, 'Anexar ofício ao NUP de pagamento'),
  ('evento', 'Desvio de qualidade', 7, 'Anexar e-mail ao NUP de pagamento'),
  ('evento', 'Desvio de qualidade', 8, 'Atualizar relatório');

-- Backfill: gera checklist pros processos/eventos já existentes antes desta migração
-- (kanban atual de cada processo)
select gerar_processo_tarefas(pkh.processo_id, 'kanban', pkh.kanban, pkh.id)
from processo_kanban_historico pkh
where pkh.saida_em is null
  and not exists (
    select 1 from processo_tarefas pt where pt.origem_tipo = 'kanban' and pt.origem_id = pkh.id
  );

-- (eventos ativos de cada processo)
select gerar_processo_tarefas(pth.processo_id, 'evento', t.valor, pth.id)
from processo_tag_historico pth
join tags t on t.id = pth.tag_id
where pth.fim_em is null
  and not exists (
    select 1 from processo_tarefas pt where pt.origem_tipo = 'evento' and pt.origem_id = pth.id
  );
