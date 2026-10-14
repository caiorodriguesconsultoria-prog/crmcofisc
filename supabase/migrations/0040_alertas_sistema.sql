-- Histórico dos avisos que notificarErroAdmins() já disparou (push pro
-- celular dos admins) — hoje esses avisos são só o push em si, sem nenhum
-- registro dentro do CRM; se alguém perde a notificação (silenciada, sem
-- internet etc.), o aviso simplesmente some. Essa tabela guarda cada um
-- pra aparecer numa tela "Avisos do sistema", com jeito de marcar como lido.
create table alertas_sistema (
  id uuid primary key default gen_random_uuid(),
  sistema text not null default 'CRM-COFISC',
  contexto text not null,
  mensagem text not null,
  created_at timestamptz not null default now(),
  lido_em timestamptz,
  lido_por uuid references pessoas(id) on delete set null
);
create index idx_alertas_sistema_created on alertas_sistema(created_at desc);

alter table alertas_sistema enable row level security;
create policy alertas_sistema_select on alertas_sistema for select using (is_authorized());
create policy alertas_sistema_update on alertas_sistema for update using (is_authorized());
-- Sem policy de insert: só a service role (usada em notificarErroAdmins)
-- grava, e service role já ignora RLS.
