-- Itens do contrato: um contrato real pode ter vários itens (ex.: Insulina
-- Regular e Insulina NPH no mesmo contrato), cada um com seu próprio
-- CATMAT/quantidade/valor e cronograma de entrega (parcelas) independente.
-- Antes só existia "1 item implícito" por contrato (quantidade_contratada/
-- valor_unitario direto em processos) e as parcelas (processo_execucoes)
-- pertenciam direto ao contrato, numeradas sequencialmente sem noção de item.
create table processo_itens (
  id uuid primary key default gen_random_uuid(),
  processo_id uuid not null references processos(id) on delete cascade,
  numero integer not null,
  descricao text not null,
  catmat text,
  unidade_medida text,
  quantidade numeric(14,3),
  valor_unitario numeric(14,4),
  created_at timestamptz not null default now(),
  unique (processo_id, numero)
);
create index idx_processo_itens_processo on processo_itens(processo_id);
alter table processo_itens enable row level security;
create policy processo_itens_all on processo_itens
  for all using (is_authorized()) with check (is_authorized());

-- Migra cada contrato já cadastrado pra "Item 1", reaproveitando o que já
-- existia (objeto como descrição, valor_unitario que já era numérico). A
-- quantidade fica em branco pro Caio revisar depois — quantidade_contratada
-- sempre foi um campo de texto livre, sem garantia de ser um número puro,
-- então não dá pra converter com segurança numa migração automática.
insert into processo_itens (processo_id, numero, descricao, unidade_medida, valor_unitario)
select id, 1, coalesce(nullif(objeto, ''), 'Item 1'), unidade_medida, valor_unitario
from processos;

-- Parcelas (cronograma de entrega) passam a pertencer a um item, não mais
-- direto ao contrato.
alter table processo_execucoes add column item_id uuid references processo_itens(id) on delete cascade;
update processo_execucoes pe
set item_id = pi.id
from processo_itens pi
where pi.processo_id = pe.processo_id and pi.numero = 1;
alter table processo_execucoes alter column item_id set not null;

-- Numeração da parcela (1ª, 2ª...) agora é por item, não mais pelo contrato
-- inteiro — cada item tem seu próprio cronograma de parcelas independente.
alter table processo_execucoes drop constraint processo_execucoes_processo_id_numero_key;
alter table processo_execucoes add constraint processo_execucoes_item_id_numero_key unique (item_id, numero);
