alter table processos
  add column conclusao_tipo text check (conclusao_tipo in ('Regular', 'Irregular')),
  add column conclusao_checks text[],
  add column conclusao_texto text,
  add column conclusao_penalidade text;
