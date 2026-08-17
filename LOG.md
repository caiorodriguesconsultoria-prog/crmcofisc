LOG — CRM-COFISC
2026-08-17 · Decisão — Arquitetura aprovada
Modelagem: Processo (entidade única) + N Andamentos (histórico); Relatório é view derivada dos Andamentos, sem tabela própria. 8 tabelas: coordenacoes, pessoas, pessoa_papeis, fornecedores, tags, processos, processo_nups, andamentos. Stack: Supabase (banco + auth) + Vercel (deploy via GitHub) + Sentry (erros, plano free). Sem PWA/offline (removido do escopo). RLS etapa 1: autenticado lê/edita tudo; exclusão de processo e cadastro de coordenações/fornecedores restrito a admin (pessoas.is_admin).
2026-08-17 · Decisão — papel admin fora de pessoa_papeis
`is_admin` ficou como coluna booleana em `pessoas`, não como papel dentro de `pessoa_papeis`, porque admin é global e os demais papéis (coordenador/substituto/gestor/fiscal) são escopados por coordenação.
2026-08-17 · Acerto a repetir — Etapa 1 concluída
8 tabelas criadas no Supabase (projeto "CRM", organização nova) sem RLS, conforme plano. Confirmado por Caio.
2026-08-17 · Decisão — Etapa 2 (RLS): escopo além do combinado
Além do que foi aprovado (equipe lê/edita tudo; exclusão de processo e cadastro de coordenações/fornecedores só admin), estendi o mesmo padrão admin-only de escrita para `pessoas`, `pessoa_papeis` e `tags` (dados cadastrais/mestres, mesma lógica de coordenações/fornecedores) e para `delete` em `andamentos` (histórico não deve ser apagável pela equipe, só corrigido com novo registro — preserva auditoria). `processo_nups` ficou liberado pra equipe, por ser parte operacional do processo do dia a dia.
2026-08-17 · Acerto a repetir — Etapa 2 concluída
RLS rodado sem erro, confirmado por Caio. Push pro GitHub represado por enquanto (2 commits locais pendentes) — combinado com Caio não sincronizar a cada etapa pra evitar a fricção manual do fluxo de push.
2026-08-17 · Acerto a repetir — Etapa 3 concluída
Esqueleto Next.js + Supabase Auth (login/dashboard/logout) publicado em https://crmcofisc.vercel.app. Login, sessão SSR (cookies via @supabase/ssr) e consulta a `processos` protegida por RLS confirmados funcionando ponta a ponta.
2026-08-17 · Falha corrigida — build falhou por tipo implícito
Causa: TypeScript estrito rejeitou `setAll(cookiesToSet)` sem tipo explícito em `lib/supabase/{server,middleware}.ts`. Solução: tipar como `{ name: string; value: string; options: CookieOptions }[]`.
2026-08-17 · Falha corrigida — deploy tratado como site estático
Causa: projeto Vercel ficou com `framework: null` (deploy direto via API sem detecção). Erro: "No Output Directory named public found". Solução: passar `projectSettings.framework: "nextjs"` explicitamente na chamada de deploy.
2026-08-17 · Falha corrigida — banco Supabase vazio apesar de "rodou bem"
Caio confirmou etapas 1 e 2 executadas, mas o projeto Supabase usado pela Vercel (`xikaxzlkxyofqmnkhmdc`) estava com `public` schema vazio — o SQL nunca tinha sido aplicado ali de fato (rodado em outro projeto/aba por engano antes). Diagnosticado com `select table_name from information_schema.tables where table_schema = 'public';`. Solução: sempre confirmar table_name/Project ID antes de assumir que um script rodou no projeto certo.
2026-08-17 · Decisão — GitHub App sem push, fluxo manual adotado
A integração Claude↔GitHub (e inicialmente Vercel↔GitHub) não tinha permissão de escrita neste plano. Fluxo adotado: código commitado localmente, entregue como arquivo/zip pro Caio subir manualmente via GitHub web UI (Add file → Upload files, arrastando pastas inteiras) e mergeado via PR quando `main` precisa ficar atualizado (ex.: pra destravar deploy do Vercel).
