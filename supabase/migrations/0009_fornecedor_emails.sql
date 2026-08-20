-- Substitui os campos fixos email_comercial/email_logistica por uma lista
-- de e-mails por fornecedor (0 a N, cada um com um rotulo livre opcional).

create table fornecedor_emails (
  id uuid primary key default gen_random_uuid(),
  fornecedor_id uuid not null references fornecedores(id) on delete cascade,
  email text not null,
  rotulo text,
  created_at timestamptz not null default now()
);

create index idx_fornecedor_emails_fornecedor_id on fornecedor_emails(fornecedor_id);

alter table fornecedor_emails enable row level security;

create policy fornecedor_emails_select on fornecedor_emails
  for select using (is_authorized());
create policy fornecedor_emails_insert on fornecedor_emails
  for insert with check (is_admin());
create policy fornecedor_emails_update on fornecedor_emails
  for update using (is_admin());
create policy fornecedor_emails_delete on fornecedor_emails
  for delete using (is_admin());

-- migra os e-mails ja cadastrados
insert into fornecedor_emails (fornecedor_id, email, rotulo)
select id, email_comercial, 'Comercial' from fornecedores
where email_comercial is not null and email_comercial <> '';

insert into fornecedor_emails (fornecedor_id, email, rotulo)
select id, email_logistica, 'Logística' from fornecedores
where email_logistica is not null and email_logistica <> '';

alter table fornecedores drop column email_comercial;
alter table fornecedores drop column email_logistica;
