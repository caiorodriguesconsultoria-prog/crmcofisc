# CRM-COFISC

Gestão de processos de fiscalização de contratos.

## Stack
- Next.js (App Router) + TypeScript
- Supabase (banco, auth, RLS)
- Vercel (deploy via GitHub)
- Sentry (monitoramento de erros, plano free)

## Variáveis de ambiente
Copie `.env.example` para `.env.local` e preencha com os dados do projeto Supabase
(Project Settings > API): `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
No Vercel, as mesmas variáveis vão em Project Settings > Environment Variables —
nunca no código.

`NEXT_PUBLIC_SENTRY_DSN` é opcional: sem ela, o app funciona normalmente e o Sentry
fica desativado (nenhum erro é reportado). Pra ativar: crie um projeto Next.js
gratuito em sentry.io, copie o DSN em Settings > Client Keys (DSN) e cole na
variável, tanto local quanto no Vercel.

## Rodar localmente
```
npm install
npm run dev
```

## Primeiro acesso
1. No Supabase: Authentication > Users > Add user (e-mail + senha)
2. Rode `supabase/migrations/0003_bootstrap_admin.sql` no SQL Editor (edite e-mail/nome antes)
3. Acesse `/login` no app com esse e-mail/senha

## Migrações
Arquivos em `supabase/migrations/`, numerados em ordem. Rodar manualmente no
SQL Editor do Supabase, um de cada vez, na ordem numérica.
