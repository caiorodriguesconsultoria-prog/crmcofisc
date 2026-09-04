-- Novo papel "responsavel" — lista própria pra escolher o Responsável
-- (titular) de um processo, separada de gestores e fiscais (que antes
-- apareciam ali junto por engano, já que o select usava todo mundo em
-- "pessoas" sem filtrar por papel).
alter table pessoa_papeis drop constraint pessoa_papeis_papel_check;
alter table pessoa_papeis add constraint pessoa_papeis_papel_check
  check (papel in ('coordenador', 'substituto', 'gestor', 'fiscal', 'equipe', 'responsavel'));
