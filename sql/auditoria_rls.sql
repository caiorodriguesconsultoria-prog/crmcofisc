-- Auditoria de Row Level Security (RLS) — CRM-COFISC
-- Este script é 100% de LEITURA. Não altera nenhuma tabela, dado ou política.
-- Rode no SQL Editor do Supabase e cole o resultado das 3 consultas de volta.

-- 1) Quais tabelas do schema "public" existem e se RLS está LIGADO ou DESLIGADO em cada uma
select
  schemaname,
  tablename,
  rowsecurity as rls_ligado
from pg_tables
where schemaname = 'public'
order by tablename;

-- 2) Quais políticas de RLS existem, em qual tabela, pra quem (roles) e o que permitem
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as operacao, -- select / insert / update / delete / all
  qual as condicao_leitura,      -- regra aplicada em SELECT/UPDATE/DELETE
  with_check as condicao_escrita -- regra aplicada em INSERT/UPDATE
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- 3) Tabelas com RLS DESLIGADO (essas são as prioritárias de revisar/corrigir)
select
  tablename
from pg_tables
where schemaname = 'public'
  and rowsecurity = false
order by tablename;
