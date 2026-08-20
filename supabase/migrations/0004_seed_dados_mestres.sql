-- CRM-COFISC — Etapa 4: seed de dados mestres (coordenações + tags)
-- Rodar manualmente no SQL Editor do Supabase, depois das etapas 1-3.
-- Valores inferidos do protótipo — ajuste livremente depois (é só um UPDATE/INSERT/DELETE, sem migração).

insert into coordenacoes (sigla, nome) values
  ('CGCEAF', 'Coordenação-Geral do Componente Especializado da Assistência Farmacêutica'),
  ('CGAFME', 'Coordenação-Geral de Assistência Farmacêutica e Medicamentos Estratégicos'),
  ('CGAFB', 'Coordenação-Geral de Assistência Farmacêutica Básica');

insert into tags (categoria, valor) values
  ('forma_entrega', 'Parcelada'),
  ('forma_entrega', 'Única'),
  ('natureza_ocorrencia', 'Avaria'),
  ('natureza_ocorrencia', 'Desvio de Qualidade'),
  ('natureza_ocorrencia', 'Falta na Entrega'),
  ('natureza_ocorrencia', 'Transcurso de Validade'),
  ('natureza_ocorrencia', 'Embalagem Comercial');
