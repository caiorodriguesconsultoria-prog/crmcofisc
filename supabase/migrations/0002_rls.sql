-- CRM-COFISC — Etapa 2: Row Level Security
-- Rodar manualmente no SQL Editor do Supabase, depois de 0001_init_schema.sql.

-- Funções auxiliares (security definer pra evitar recursão de RLS ao consultar 'pessoas')
create or replace function is_authorized()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from pessoas where auth_user_id = auth.uid() and ativo = true
  );
$$;

create or replace function is_admin()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from pessoas where auth_user_id = auth.uid() and ativo = true and is_admin = true
  );
$$;

-- Habilitar RLS em todas as tabelas
alter table coordenacoes enable row level security;
alter table pessoas enable row level security;
alter table pessoa_papeis enable row level security;
alter table fornecedores enable row level security;
alter table tags enable row level security;
alter table processos enable row level security;
alter table processo_nups enable row level security;
alter table andamentos enable row level security;

-- coordenacoes: leitura geral, cadastro só admin
create policy coordenacoes_select on coordenacoes for select using (is_authorized());
create policy coordenacoes_write on coordenacoes for insert with check (is_admin());
create policy coordenacoes_update on coordenacoes for update using (is_admin());
create policy coordenacoes_delete on coordenacoes for delete using (is_admin());

-- pessoas: leitura geral (equipe se vê), cadastro/edição só admin
create policy pessoas_select on pessoas for select using (is_authorized());
create policy pessoas_write on pessoas for insert with check (is_admin());
create policy pessoas_update on pessoas for update using (is_admin());
create policy pessoas_delete on pessoas for delete using (is_admin());

-- pessoa_papeis: leitura geral, gestão só admin
create policy pessoa_papeis_select on pessoa_papeis for select using (is_authorized());
create policy pessoa_papeis_write on pessoa_papeis for insert with check (is_admin());
create policy pessoa_papeis_update on pessoa_papeis for update using (is_admin());
create policy pessoa_papeis_delete on pessoa_papeis for delete using (is_admin());

-- fornecedores: leitura geral, cadastro só admin
create policy fornecedores_select on fornecedores for select using (is_authorized());
create policy fornecedores_write on fornecedores for insert with check (is_admin());
create policy fornecedores_update on fornecedores for update using (is_admin());
create policy fornecedores_delete on fornecedores for delete using (is_admin());

-- tags: leitura geral, gestão só admin
create policy tags_select on tags for select using (is_authorized());
create policy tags_write on tags for insert with check (is_admin());
create policy tags_update on tags for update using (is_admin());
create policy tags_delete on tags for delete using (is_admin());

-- processos: equipe lê e edita tudo; exclusão só admin
create policy processos_select on processos for select using (is_authorized());
create policy processos_write on processos for insert with check (is_authorized());
create policy processos_update on processos for update using (is_authorized());
create policy processos_delete on processos for delete using (is_admin());

-- processo_nups: segue o processo, equipe gerencia livremente
create policy processo_nups_select on processo_nups for select using (is_authorized());
create policy processo_nups_write on processo_nups for insert with check (is_authorized());
create policy processo_nups_update on processo_nups for update using (is_authorized());
create policy processo_nups_delete on processo_nups for delete using (is_authorized());

-- andamentos: histórico — equipe lê e registra; exclusão só admin (preserva auditoria)
create policy andamentos_select on andamentos for select using (is_authorized());
create policy andamentos_write on andamentos for insert with check (is_authorized());
create policy andamentos_update on andamentos for update using (is_authorized());
create policy andamentos_delete on andamentos for delete using (is_admin());
