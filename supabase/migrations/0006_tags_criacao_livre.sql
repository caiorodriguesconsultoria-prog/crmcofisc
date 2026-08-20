-- CRM-COFISC — Etapa 4c: qualquer usuário autenticado pode criar novas tags
-- Edição/exclusão de tags existentes continua só admin.
-- Rodar manualmente no SQL Editor, depois da etapa 4b.

drop policy if exists tags_write on tags;
create policy tags_write on tags for insert with check (is_authorized());
