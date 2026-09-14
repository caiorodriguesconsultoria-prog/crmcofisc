-- Nova etapa de Kanban "Cobertura concluída", usada para encerrar processos
-- que estavam em cobertura de férias (ver botão "Concluir cobertura de
-- férias"). Entra no fim da lista de etapas existente.
insert into kanban_colunas (nome, ordem)
select 'Cobertura concluída', coalesce(max(ordem), -1) + 1
from kanban_colunas
where not exists (
  select 1 from kanban_colunas where nome = 'Cobertura concluída'
);
