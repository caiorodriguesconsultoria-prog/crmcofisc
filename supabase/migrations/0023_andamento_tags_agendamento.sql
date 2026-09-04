-- Tira os checklists automáticos de evento (o histórico de kanban continua
-- gerando checklist normalmente, só o de evento para) e passa a permitir
-- marcar um andamento com as tags de evento relacionadas + um agendamento
-- (data/horário) opcional — substitui o checklist por evento por um fluxo
-- único: criar o andamento já com tags e data, tudo na mesma janela.

alter table andamentos add column if not exists agendamento_data date;
alter table andamentos add column if not exists agendamento_horario time;
alter table andamentos add column if not exists google_event_id text;

create table andamento_tags (
  andamento_id uuid not null references andamentos(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  primary key (andamento_id, tag_id)
);
create index idx_andamento_tags_andamento on andamento_tags(andamento_id);

alter table andamento_tags enable row level security;
create policy andamento_tags_select on andamento_tags for select using (is_authorized());
create policy andamento_tags_write on andamento_tags for insert with check (is_authorized());
create policy andamento_tags_delete on andamento_tags for delete using (is_authorized());

-- Ativar um evento (inserir em processo_tags) deixa de gerar checklist
-- automático — só continua registrando o histórico de início/fim do evento
-- (processo_tag_historico), que ainda alimenta a seção "Histórico".
create or replace function registrar_tag_historico()
returns trigger language plpgsql as $$
begin
  if TG_OP = 'INSERT' then
    insert into processo_tag_historico (processo_id, tag_id, inicio_em)
    values (new.processo_id, new.tag_id, now());
  elsif TG_OP = 'DELETE' then
    update processo_tag_historico
      set fim_em = now()
      where processo_id = old.processo_id and tag_id = old.tag_id and fim_em is null;
  end if;
  return coalesce(new, old);
end;
$$;
