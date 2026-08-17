-- CRM-COFISC — Etapa 1: tabelas base (sem RLS)
-- Rodar manualmente no SQL Editor do Supabase.

create extension if not exists pgcrypto;

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 1. coordenacoes
create table coordenacoes (
  id uuid primary key default gen_random_uuid(),
  sigla text not null unique,
  nome text not null,
  email_generico text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_coordenacoes_updated before update on coordenacoes
  for each row execute function set_updated_at();

-- 2. pessoas
create table pessoas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  matricula text unique,
  email text not null unique,
  ramal text,
  auth_user_id uuid unique references auth.users(id) on delete set null,
  is_admin boolean not null default false,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_pessoas_updated before update on pessoas
  for each row execute function set_updated_at();

-- 3. pessoa_papeis (papéis por coordenação; admin fica em pessoas.is_admin, não é papel de coordenação)
create table pessoa_papeis (
  id uuid primary key default gen_random_uuid(),
  pessoa_id uuid not null references pessoas(id) on delete cascade,
  coordenacao_id uuid not null references coordenacoes(id) on delete cascade,
  papel text not null check (papel in ('coordenador','substituto','gestor','fiscal')),
  created_at timestamptz not null default now(),
  unique (pessoa_id, coordenacao_id, papel)
);

-- 4. fornecedores
create table fornecedores (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cnpj text not null unique,
  endereco text,
  preposto text,
  telefone text,
  email_comercial text,
  email_logistica text,
  banco_conta text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_fornecedores_updated before update on fornecedores
  for each row execute function set_updated_at();

-- 5. tags (forma_entrega / natureza_ocorrencia) — lookup, não enum, pra adicionar sem migração
create table tags (
  id uuid primary key default gen_random_uuid(),
  categoria text not null check (categoria in ('forma_entrega','natureza_ocorrencia')),
  valor text not null,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  unique (categoria, valor)
);

-- 6. processos (entidade única)
create table processos (
  id uuid primary key default gen_random_uuid(),
  numero_contrato text not null,
  nup_principal text not null,
  objeto text not null,
  coordenacao_id uuid not null references coordenacoes(id),
  fornecedor_id uuid not null references fornecedores(id),
  valor_unitario numeric(14,2),
  valor_global numeric(14,2),
  vigencia_inicio date,
  vigencia_fim date,
  forma_entrega_tag_id uuid references tags(id),
  natureza_ocorrencia_tag_id uuid references tags(id),
  etapa_atual text not null default 'Aguardando Andamento' check (etapa_atual in (
    'Aguardando Andamento',
    'Ofício de Apresentação',
    'Aguardando Entrega',
    'Transcurso de Validade/Embalagem',
    'Avaria/Desvio de Qualidade/Falta na Entrega',
    'Relatório',
    'Concluído'
  )),
  titular_id uuid not null references pessoas(id),
  responsavel_atual_id uuid not null references pessoas(id),
  motivo_backup text,
  situacao text not null default 'em_execucao' check (situacao in ('em_execucao','prorrogado','concluido')),
  dados_complementares jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_processos_updated before update on processos
  for each row execute function set_updated_at();

create index idx_processos_coordenacao on processos(coordenacao_id);
create index idx_processos_fornecedor on processos(fornecedor_id);
create index idx_processos_etapa on processos(etapa_atual);
create index idx_processos_responsavel on processos(responsavel_atual_id);

-- 7. processo_nups (1:N)
create table processo_nups (
  id uuid primary key default gen_random_uuid(),
  processo_id uuid not null references processos(id) on delete cascade,
  tipo text not null check (tipo in ('principal','relatorio','pagamento')),
  nup text not null,
  created_at timestamptz not null default now()
);
create index idx_processo_nups_processo on processo_nups(processo_id);

-- 8. andamentos (histórico; Relatório é view derivada, não tabela)
create table andamentos (
  id uuid primary key default gen_random_uuid(),
  processo_id uuid not null references processos(id) on delete cascade,
  etapa_relacionada text,
  tipo text not null,
  texto text not null,
  autor_id uuid references pessoas(id),
  data timestamptz not null default now(),
  sei_numero text,
  created_at timestamptz not null default now()
);
create index idx_andamentos_processo on andamentos(processo_id);
