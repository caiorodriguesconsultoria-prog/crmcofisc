-- Nome e e-mail de contato de quem é responsável pelo pagamento do
-- contrato — texto livre (não é necessariamente alguém cadastrado como
-- gestor/fiscal no sistema), editável no card "Dados principais".
alter table processos add column responsavel_pagamento_nome text;
alter table processos add column responsavel_pagamento_email text;
