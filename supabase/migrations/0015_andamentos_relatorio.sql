-- Etapa "Relatório" (4/6): Andamentos com modelos de texto + inclusão no relatório (seção 5, Ocorrências).

alter table andamentos add column incluir_relatorio boolean not null default false;
