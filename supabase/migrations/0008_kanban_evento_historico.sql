-- CRM-COFISC — Etapa 6: kanbans padronizados + histórico estruturado de kanban e tags
-- Rodar manualmente no SQL Editor, depois da etapa 5.
-- Reaproveita processos.etapa_atual (kanban) e tags/processo_tags (tags) já existentes;
-- adiciona só o que faltava: histórico com entrada/saída/duração.

-- 1. Kanbans novos (substituem os 7 originais)
-- salvaguarda: se sobrar alguma linha com valor antigo, reclassifica pro kanban inicial antes de travar o check novo
update processos
  set etapa_atual = 'Ofício de apresentação'
  where etapa_atual not in (
    'Ofício de apresentação',
    'Aguardando entrega',
    'Aguardando assinatura',
    'Aguardando pagamento',
    'Aguardando Área Técnica'
  );

alter table processos drop constraint processos_etapa_atual_check;
alter table processos alter column etapa_atual set default 'Ofício de apresentação';
alter table processos add constraint processos_etapa_atual_check check (etapa_atual in (
  'Ofício de apresentação',
  'Aguardando entrega',
  'Aguardando assinatura',
  'Aguardando pagamento',
  'Aguardando Área Técnica'
));

-- 2. Histórico de kanban (uma linha por passagem; entrada/saída/duração)
create table processo_kanban_historico (
  id uuid primary key default gen_random_uuid(),
  processo_id uuid not null references processos(id) on delete cascade,
  kanban text not null,
  entrada_em timestamptz not null default now(),
  saida_em timestamptz,
  duracao interval generated always as (saida_em - entrada_em) stored
);
create index idx_kanban_historico_processo on processo_kanban_historico(processo_id);
create index idx_kanban_historico_kanban on processo_kanban_historico(kanban);

alter table processo_kanban_historico enable row level security;
create policy kanban_historico_select on processo_kanban_historico for select using (is_authorized());
create policy kanban_historico_write on processo_kanban_historico for insert with check (is_authorized());
create policy kanban_historico_update on processo_kanban_historico for update using (is_authorized());
create policy kanban_historico_delete on processo_kanban_historico for delete using (is_admin());

-- 3. Histórico de tags/eventos (uma linha por ativação; início/fim/duração)
create table processo_tag_historico (
  id uuid primary key default gen_random_uuid(),
  processo_id uuid not null references processos(id) on delete cascade,
  tag_id uuid not null references tags(id),
  inicio_em timestamptz not null default now(),
  fim_em timestamptz,
  duracao interval generated always as (fim_em - inicio_em) stored
);
create index idx_tag_historico_processo on processo_tag_historico(processo_id);
create index idx_tag_historico_tag on processo_tag_historico(tag_id);

alter table processo_tag_historico enable row level security;
create policy tag_historico_select on processo_tag_historico for select using (is_authorized());
create policy tag_historico_write on processo_tag_historico for insert with check (is_authorized());
create policy tag_historico_update on processo_tag_historico for update using (is_authorized());
create policy tag_historico_delete on processo_tag_historico for delete using (is_admin());

-- 4. Preenchimento automático do histórico via trigger — não depende do app lembrar de gravar

create or replace function registrar_kanban_historico()
returns trigger language plpgsql as $$
begin
  if TG_OP = 'INSERT' then
    insert into processo_kanban_historico (processo_id, kanban, entrada_em)
    values (new.id, new.etapa_atual, now());
  elsif TG_OP = 'UPDATE' and new.etapa_atual is distinct from old.etapa_atual then
    update processo_kanban_historico
      set saida_em = now()
      where processo_id = new.id and saida_em is null;
    insert into processo_kanban_historico (processo_id, kanban, entrada_em)
    values (new.id, new.etapa_atual, now());
  end if;
  return new;
end;
$$;

create trigger trg_processos_kanban_historico
after insert or update on processos
for each row execute function registrar_kanban_historico();

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

create trigger trg_processo_tags_historico
after insert or delete on processo_tags
for each row execute function registrar_tag_historico();

-- backfill: garante histórico pra qualquer processo já existente antes desta migração
insert into processo_kanban_historico (processo_id, kanban, entrada_em)
select id, etapa_atual, created_at
from processos
where id not in (select processo_id from processo_kanban_historico);

-- 5. Tags: renomeia categoria e ajusta lista fixa de "Evento"
alter table tags drop constraint tags_categoria_check;
update tags set categoria = 'evento' where categoria = 'natureza_ocorrencia';
alter table tags add constraint tags_categoria_check check (categoria in ('forma_entrega','evento'));

update tags set valor = 'Alteração de Marca' where categoria = 'evento' and valor = 'Substituição de marca';
update tags set valor = 'Avaria na Entrega' where categoria = 'evento' and valor = 'Avaria';
update tags set valor = 'Desvio de qualidade' where categoria = 'evento' and valor = 'Desvio de Qualidade';
update tags set ativo = false where categoria = 'evento' and valor = 'Transcurso de Validade';

insert into tags (categoria, valor)
select 'evento', v from (values
  ('Transcurso de validade - 40%'),
  ('Transcurso de validade - 30%'),
  ('Atraso na entrega'),
  ('Alteração no cronograma'),
  ('Alteração de Preço')
) as novos(v)
where not exists (select 1 from tags where categoria = 'evento' and valor = novos.v);
