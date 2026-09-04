-- Cor escolhida manualmente por evento (tag categoria='evento'), pra usar
-- nos gráficos e pílulas em vez da cor automática por hash. Fica nula pros
-- eventos já cadastrados até alguém escolher uma cor pra eles (cai no
-- comportamento antigo, automático, enquanto isso).
alter table tags add column cor text;
