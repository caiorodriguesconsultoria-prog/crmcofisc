-- Unidade de medida do objeto (campo livre) e forma de Execução
-- (Centralizada/Descentralizada, escolhida manualmente, independente do
-- "Forma de entrega" que já existe e do cálculo automático do Quadro
-- Resumitivo do Relatório).
alter table processos add column unidade_medida text;
alter table processos add column execucao_forma text check (execucao_forma in ('Centralizada', 'Descentralizada'));

-- Nova etapa usada pelo fluxo de confirmação de entrega (Cronograma) —
-- quando a entrega não ocorre ou ocorre com algum problema, o processo
-- entra automaticamente nessa etapa.
insert into kanban_colunas (nome, ordem)
select 'Criação de Ofício', coalesce((select max(ordem) + 1 from kanban_colunas), 0)
where not exists (select 1 from kanban_colunas where nome = 'Criação de Ofício');
