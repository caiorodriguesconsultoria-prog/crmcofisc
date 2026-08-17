LOG — CRM-COFISC
2026-08-17 · Decisão — Arquitetura aprovada
Modelagem: Processo (entidade única) + N Andamentos (histórico); Relatório é view derivada dos Andamentos, sem tabela própria. 8 tabelas: coordenacoes, pessoas, pessoa_papeis, fornecedores, tags, processos, processo_nups, andamentos. Stack: Supabase (banco + auth) + Vercel (deploy via GitHub) + Sentry (erros, plano free). Sem PWA/offline (removido do escopo). RLS etapa 1: autenticado lê/edita tudo; exclusão de processo e cadastro de coordenações/fornecedores restrito a admin (pessoas.is_admin).
2026-08-17 · Decisão — papel admin fora de pessoa_papeis
`is_admin` ficou como coluna booleana em `pessoas`, não como papel dentro de `pessoa_papeis`, porque admin é global e os demais papéis (coordenador/substituto/gestor/fiscal) são escopados por coordenação.
