-- CRM-COFISC — Bootstrap do primeiro usuário admin
-- Rodar manualmente no SQL Editor, DEPOIS de criar o usuário em
-- Authentication > Users > Add user (defina e-mail e senha por lá).
--
-- Troque os valores abaixo antes de rodar:
--   'seu-email@exemplo.com'      -> e-mail cadastrado em Authentication > Users
--   'Seu Nome'                   -> seu nome

insert into pessoas (nome, email, auth_user_id, is_admin, ativo)
select
  'Seu Nome',
  'seu-email@exemplo.com',
  id,
  true,
  true
from auth.users
where email = 'seu-email@exemplo.com';
