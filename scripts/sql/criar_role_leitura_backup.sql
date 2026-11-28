-- PROPOSTA — avaliação de credencial exclusiva de leitura para a rotina de
-- backup (pg_dump + consulta de consistência), ver docs/audit/BRANCH_SYNC.md §13.
--
-- NÃO EXECUTAR AUTOMATICAMENTE. Este arquivo é entregue pra Caio rodar
-- manualmente no SQL Editor do Supabase, por convenção do projeto
-- (CLAUDE.md: toda alteração de schema/role é .sql manual, nunca executada
-- direto). Depois de criar e definir a senha, gerar uma nova connection
-- string e guardá-la como um GitHub Secret novo (ex. SUPABASE_DB_URL_LEITURA),
-- sem substituir o SUPABASE_DB_URL atual até os workflows serem migrados.
--
-- Por que isto importa: hoje o backup (pg_dump) e a futura checagem de
-- consistência usam a mesma connection string "SUPABASE_DB_URL", que
-- presumivelmente tem mais privilégio que o necessário (owner/service).
-- Um role de leitura reduz o que um secret comprometido exposto por engano
-- (ex. log de CI) poderia fazer: ler os dados, nunca alterá-los.
--
-- Nota sobre Storage: NÃO existe hoje um equivalente de "chave só leitura"
-- pra Storage no Supabase — baixar objetos de um bucket privado exige
-- service_role (ou uma signed URL assinada por quem já tem acesso de
-- escrita). Criar policies de SELECT amplas pra um role de leitura não
-- reduziria risco, na prática ampliaria a superfície de acesso. Por isso
-- scripts/backup_storage.py continua usando SUPABASE_SERVICE_ROLE_KEY —
-- documentado como limitação conhecida, não como pendência resolvível só
-- com SQL.

create role backup_leitura with login password '<definir-senha-forte-aqui>';

-- pg_read_all_data (role nativo do Postgres 15+): SELECT em todas as
-- tabelas/sequências/views de todos os schemas, sem escrita, sem DDL, sem
-- acesso a funções que alterem dados. É o mínimo que pg_dump precisa.
grant pg_read_all_data to backup_leitura;

comment on role backup_leitura is
  'Role de leitura exclusiva para a rotina de backup (pg_dump) e para a checagem de consistência banco/Storage — proposto em docs/audit/BRANCH_SYNC.md §13, scripts/retencao_gfs.py e scripts/verifica_consistencia_anexos.py.';
