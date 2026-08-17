# LOG — CRM-COFISC

## 2026-08-17 · Decisão — Arquitetura aprovada
Modelagem: Processo (entidade única) + N Andamentos (histórico); Relatório é view derivada dos Andamentos, sem tabela própria. 8 tabelas: coordenacoes, pessoas, pessoa_papeis, fornecedores, tags, processos, processo_nups, andamentos. Stack: Supabase (banco + auth) + Vercel (deploy via GitHub) + Sentry (erros, plano free). Sem PWA/offline (removido do escopo). RLS etapa 1: autenticado lê/edita tudo; exclusão de processo e cadastro de coordenações/fornecedores restrito a admin (pessoas.is_admin).

## 2026-08-17 · Decisão — papel admin fora de pessoa_papeis
`is_admin` ficou como coluna booleana em `pessoas`, não como papel dentro de `pessoa_papeis`, porque admin é global e os demais papéis (coordenador/substituto/gestor/fiscal) são escopados por coordenação.

## 2026-08-17 · Acerto a repetir — Etapa 1 concluída
8 tabelas criadas no Supabase (projeto "CRM", organização nova) sem RLS, conforme plano. Confirmado por Caio.

## 2026-08-17 · Decisão — Etapa 2 (RLS): escopo além do combinado
Além do que foi aprovado (equipe lê/edita tudo; exclusão de processo e cadastro de coordenações/fornecedores só admin), estendi o mesmo padrão admin-only de escrita para `pessoas`, `pessoa_papeis` e `tags` (dados cadastrais/mestres, mesma lógica de coordenações/fornecedores) e para `delete` em `andamentos` (histórico não deve ser apagável pela equipe, só corrigido com novo registro — preserva auditoria). `processo_nups` ficou liberado pra equipe, por ser parte operacional do processo do dia a dia.

## 2026-08-17 · Acerto a repetir — Etapa 2 concluída
RLS rodado sem erro, confirmado por Caio. Push pro GitHub represado por enquanto (2 commits locais pendentes) — combinado com Caio não sincronizar a cada etapa pra evitar a fricção manual do fluxo de push.
