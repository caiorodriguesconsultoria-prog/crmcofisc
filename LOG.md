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

## 2026-08-17 · Acerto a repetir — Etapa 3 concluída
Esqueleto Next.js + Supabase Auth (login/dashboard/logout) publicado em https://crmcofisc.vercel.app. Login, sessão SSR (cookies via @supabase/ssr) e consulta a `processos` protegida por RLS confirmados funcionando ponta a ponta.

## 2026-08-17 · Falha corrigida — build falhou por tipo implícito
Causa: TypeScript estrito rejeitou `setAll(cookiesToSet)` sem tipo explícito em `lib/supabase/{server,middleware}.ts`. Solução: tipar como `{ name: string; value: string; options: CookieOptions }[]`.

## 2026-08-17 · Falha corrigida — deploy tratado como site estático
Causa: projeto Vercel ficou com `framework: null` (deploy direto via API sem detecção). Erro: "No Output Directory named public found". Solução: passar `projectSettings.framework: "nextjs"` explicitamente na chamada de deploy.

## 2026-08-17 · Falha corrigida — banco Supabase vazio apesar de "rodou bem"
Caio confirmou etapas 1 e 2 executadas, mas o projeto Supabase usado pela Vercel (`xikaxzlkxyofqmnkhmdc`) estava com `public` schema vazio — o SQL nunca tinha sido aplicado ali de fato (rodado em outro projeto/aba por engano antes). Diagnosticado com `select table_name from information_schema.tables where table_schema = 'public';`. Solução: sempre confirmar table_name/Project ID antes de assumir que um script rodou no projeto certo.

## 2026-08-17 · Decisão — GitHub App sem push, fluxo manual adotado
A integração Claude↔GitHub (e inicialmente Vercel↔GitHub) não tinha permissão de escrita neste plano. Fluxo adotado: código commitado localmente, entregue como arquivo/zip pro Caio subir manualmente via GitHub web UI (Add file → Upload files, arrastando pastas inteiras) e mergeado via PR quando `main` precisa ficar atualizado (ex.: pra destravar deploy do Vercel).

## 2026-08-18 · Decisão — Etapa 4: seed de coordenações e tags
Valores de coordenações (CGCEAF/CGAFME/CGAFB) e tags de forma_entrega/natureza_ocorrencia inferidos do protótipo original, não confirmados por Caio ainda. Como `tags` e `coordenacoes` são tabelas simples (não enum), qualquer ajuste depois é um INSERT/UPDATE/DELETE direto, sem migração.

## 2026-08-18 · Decisão — natureza_ocorrencia passa a ser N:N
Caio confirmou que um processo pode ter várias naturezas de ocorrência ao mesmo tempo (ex.: Transcurso de Validade + Embalagem Comercial + Substituição de marca juntas). Removida a coluna única `processos.natureza_ocorrencia_tag_id`, criada tabela de relação `processo_tags` (processo_id, tag_id) para suportar múltiplas tags por processo. `forma_entrega` continua de valor único (Parcelada ou Única são mutuamente exclusivas).

## 2026-08-18 · Decisão — criação de tags liberada pra equipe
Caio pediu pra poder criar tags novas à medida que surgem casos, sem depender de SQL/admin. RLS ajustado: `insert` em `tags` liberado pra qualquer autenticado; `update`/`delete` continuam só admin, pra não editar/apagar tag em uso por engano. A tela pra criar tag "na hora" (inline, dentro do formulário de processo) ainda não existe — vem junto com a tela de cadastro de processo.

## 2026-08-18 · Acerto a repetir — Etapas 4, 4b e 4c concluídas
Coordenações, tags (incl. Substituição de marca), tabela `processo_tags` (N:N) e RLS de criação livre de tags confirmados rodando sem erro por Caio.

## 2026-08-19 · Falha corrigida — RLS bloqueando silenciosamente sem erro
Causa raiz do "0 processos" e dropdowns vazios na tela de novo processo: `select` bloqueado por RLS não gera erro (`using` só filtra linhas, diferente de `insert/update` que geram erro no `with check`). O bootstrap do admin (0003) nunca tinha inserido a linha em `pessoas` de fato (WHERE por e-mail não bateu na primeira tentativa), então `is_authorized()` sempre retornava falso. Diagnosticado comparando `select * from pessoas` (vazio) com `select id, email from auth.users` (1 linha). Lição: quando uma tela SELECT aparece vazia sem erro nenhum, suspeitar de RLS antes de qualquer outra coisa — e passar a expor os `error` de toda consulta na tela (não só descartar), pra não repetir esse diagnóstico às cegas.

## 2026-08-19 · Acerto a repetir — Etapa 8 concluída
Andamentos (registro narrativo com tipo/texto/SEI/autor) confirmados funcionando no painel do processo.

## 2026-08-19 · Acerto a repetir — Etapa 7 concluída
Painel do processo (troca de kanban, adicionar/remover eventos, históricos de kanban e evento) testado e confirmado funcionando por Caio, incluindo o preenchimento automático do histórico via trigger.

## 2026-08-19 · Decisão — Etapa 7: painel do processo
Criada tela `/processos/[id]` com: mudar kanban (dropdown + salvar, dispara o trigger de histórico), adicionar/remover eventos ativos (dispara o trigger de início/fim), e listagem dos históricos de kanban e de evento. Lista de processos agora linka pra essa tela.

## 2026-08-19 · Acerto a repetir — Etapa 6 concluída
Kanbans novos, histórico automático (trigger) de kanban e tags, e tags "Evento" renomeadas — SQL rodado sem erro, confirmado por Caio. Ajuste feito a pedido: seleção de evento removida da tela de criação de processo — todo processo novo nasce em "Ofício de apresentação" sem eventos marcados; eventos só poderão ser adicionados numa tela de edição (ainda não construída).

## 2026-08-19 · Decisão — Kanban/Tag/Evento/Histórico reestruturados
Caio pediu separação clara: Kanban = estado atual (1 por processo), Tag = ocorrência manual (várias simultâneas), Evento/Histórico = registro permanente (nunca apagado). Reaproveitado o que já existia (`etapa_atual` = kanban, `tags`+`processo_tags` = tag) em vez de criar estrutura paralela. Adicionado: `processo_kanban_historico` e `processo_tag_historico` (entrada/saída, duração calculada via coluna gerada), populados automaticamente por trigger (não depende do app lembrar de gravar). `etapa_atual` trocou os 7 valores originais pelos 5 kanbans novos (Ofício de apresentação / Aguardando entrega / Aguardando assinatura / Aguardando pagamento / Aguardando Área Técnica) — "Aguardando Andamento", "Relatório" e "Concluído" removidos a pedido de Caio. Categoria de tag `natureza_ocorrencia` renomeada pra `evento` (rótulo "Natureza da ocorrência" → "Evento" na UI); "Substituição de marca" renomeada pra "Alteração de Marca". Fora de escopo por ora (não pedido): tela de kanban/board, tela de histórico/relatórios, remoção de tag ativa pela UI.

## 2026-08-20 · Acerto a repetir — Tela de cadastro de fornecedores
Criadas `/fornecedores` (lista) e `/fornecedores/novo` (criação, admin-only) — antes só dava pra cadastrar fornecedor via SQL Editor. RLS já existente (insert/update/delete só `is_admin()`) reaproveitado sem migração nova; tela só verifica `pessoas.is_admin` do usuário logado pra mostrar/esconder o link de criação e redirecionar acesso direto à URL. Deploy testado em produção antes de confirmar com Caio.

## 2026-08-20 · Decisão — e-mail de fornecedor vira lista (0 a N)
Caio pediu suporte a múltiplos e-mails por fornecedor (varia de 1 a 3 na prática). Substituídas as colunas fixas `email_comercial`/`email_logistica` por tabela `fornecedor_emails` (fornecedor_id, email, rótulo livre opcional), migração 0009 migra os dados existentes antes de dropar as colunas antigas. Formulário de novo fornecedor ganhou campo repetível "+ Adicionar e-mail"; lista de fornecedores mostra todos os e-mails com rótulo entre parênteses.

## 2026-08-20 · Acerto a repetir — Fornecedores e e-mails em lista confirmados
SQL 0009 rodado, deploy em produção testado e confirmado por Caio (cadastro de fornecedor com múltiplos e-mails funcionando).

## 2026-08-20 · Decisão — tela de pessoas descartada, uso é individual
Caio informou que será o único usuário do sistema — tela de cadastro de equipe (pessoas) não é necessária por ora. Seguimos direto para coordenações, que ainda dependiam do SQL Editor.

## 2026-08-20 · Acerto a repetir — Tela de cadastro de coordenações
Criadas `/coordenacoes` (lista) e `/coordenacoes/novo` (criação, admin-only), mesmo padrão das telas de fornecedores. RLS já existente reaproveitado sem migração nova.

## 2026-08-20 · Acerto a repetir — Coordenações confirmadas em produção
Deploy testado e confirmado por Caio (cadastro de coordenação funcionando, selecionável ao criar processo).

## 2026-08-20 · Decisão — Painel/dashboard real
Substituída a contagem simples do dashboard por: total de processos, processos por etapa (kanban), eventos ativos em aberto e lista de "processos parados" (dias na etapa atual, calculado via `processo_kanban_historico` — entrada sem saída). Limite de dias pra considerar "parado" é um campo editável na tela (padrão 15, ajustável em tempo real pelo usuário), não fixo no código, a pedido de Caio.

## 2026-08-20 · Acerto a repetir — Painel/dashboard confirmado
Deploy testado e confirmado por Caio (contagem por etapa, eventos ativos e lista de parados com campo de dias editável funcionando).

## 2026-08-20 · Decisão — cobertura de férias volta ao escopo
Reconsiderado: mesmo com Caio como único usuário hoje, cobertura de férias (handoff titular↔responsável) permanece no escopo — construir na sequência de telas.

## 2026-08-20 · Pendência levantada — tipo de assinatura aguardada
Caio identificou que falta, no painel do processo, indicar qual tipo de assinatura está pendente quando a etapa é "Aguardando assinatura" (ex.: Contrato, Termo Aditivo, Ofício). É funcionalidade/dado, não item de design visual — aguardando definição de Caio sobre o formato (tag nova vs. campo dedicado) antes de implementar.

## 2026-08-20 · Decisão — pendência "tipo de assinatura" descartada
Caio decidiu não incluir a tag de tipo de assinatura pendente. Fora de escopo.

## 2026-08-20 · Acerto a repetir — Cobertura de férias implementada
Painel do processo ganhou seção "Responsável": mostra titular e (se diferente) responsável atual em cobertura + motivo. Botão "Transferir" seleciona novo responsável + motivo obrigatório (`processos.responsavel_atual_id`/`motivo_backup`); botão "Retornar ao titular" limpa o backup. Sem migração nova — colunas já existiam desde 0001, RLS de `processos.update` já é liberado pra equipe. Também corrigido: o painel mostrava sempre o titular como "Responsável", nunca o responsável atual real.

## 2026-08-20 · Decisão — cobertura de férias também na abertura do processo
Caio esclareceu que a cobertura precisa poder ser definida já na criação do processo (não só depois, via painel) — é o que diferencia processos abertos "para si" dos abertos em cobertura de outro titular ausente. Formulário de novo processo ganhou checkbox "Abrir em cobertura", que revela campos "Quem assume agora" + motivo (obrigatórios se marcado); sem marcar, comportamento é o mesmo de antes (responsável atual = titular).

## 2026-08-20 · Acerto a repetir — Cobertura de férias confirmada (painel + abertura)
Deploy testado e confirmado por Caio: transferir/retornar responsável no painel do processo, e abrir processo já em cobertura na criação, ambos funcionando em produção.

## 2026-08-20 · Decisão — Sentry configurado (erros apenas)
Adicionado `@sentry/nextjs`, com `instrumentation.ts` (server/edge), `instrumentation-client.ts` (browser) e `app/global-error.tsx` (captura erros de renderização React). `tracesSampleRate: 0` e sem integração de session replay — só captura de erro, conforme combinado no stack original. DSN lido de `NEXT_PUBLIC_SENTRY_DSN` (env var, opcional): sem ela definida, o Sentry fica inativo e o app funciona normalmente — nada quebra enquanto Caio não cria o projeto no sentry.io e cola o DSN no Vercel. Não configurado upload de source maps no build (evita precisar de `SENTRY_AUTH_TOKEN`, mais uma credencial pra gerenciar); stacktraces em produção ficam minificados — aceitável pro escopo atual, pode ser revisto depois se virar necessidade.

## 2026-08-20 · Acerto a repetir — Sentry ativo em produção
Caio criou o projeto no sentry.io, cadastrou `NEXT_PUBLIC_SENTRY_DSN` no Vercel e alerta "high priority issues" com notificação por e-mail. Novo deploy disparado pra pegar a variável, confirmado rodando (READY). Monitoramento de erros ativo.

## 2026-08-20 · Decisão — construir estrutura completa antes do design
Caio decidiu completar toda a estrutura vista no protótipo original (Claude Design, arquivo `COFISC - Processos.dc.html` na pasta do Drive) antes de partir pro design visual. Levantamento comparado com o protótipo mostrou lacunas por tamanho: pequenas (NUPs nomeados, campo valor, selo cobertura de férias — banco já suportava), médias (Gestores/Fiscais, contratos por fornecedor, filtros, SEI/prazo) e grandes (Kanban com checklist de tarefas por etapa, Agenda, aba Relatório completa).

## 2026-08-20 · Decisão — campos do Relatório em colunas, não JSON
Dos 24 campos do "Quadro resumitivo" do protótipo, a maioria já tem equivalente no banco (contrato, objeto, vigência, valor, gestor/fiscal). Os ~11 genuinamente novos (Processo Eletrônico, Pregão, Ata de Registro de Preços, Publicação D.O.U/PNCP, Valor da Garantia, Portaria de Designação de Fiscal, Nota de Empenho, Programa de Trabalho, Natureza de Despesa, Local de Entrega) viraram colunas reais em `processos` (migração 0010), não um campo `dados_complementares` genérico — número pequeno o suficiente pra não virar bagunça, e colunas reais validam melhor.

## 2026-08-20 · Decisão/SQL — Migração 0010 (relatório, gestor/fiscal, execuções)
Adiciona os 11 campos do relatório + `prazo_data` + `gestor_id`/`gestor_substituto_id`/`fiscal_id`/`fiscal_substituto_id` em `processos`, e cria `processo_execucoes` (cronograma de entregas: número, quantidade, unidade, data prevista, situação), RLS liberado pra equipe igual `processo_nups`. "SEI" do protótipo vira reaproveitamento de `processo_eletronico_numero` preenchido — não precisa de coluna própria.

## 2026-08-20 · Decisão — checklist de tarefas: Kanban confirmado + eventos
Caio confirmou a separação Kanban×Evento como já estava, com os 5 nomes de Kanban definidos anteriormente. Das 8 listas de tarefas do protótipo, só "Ofício de apresentação" bate 1:1 com uma etapa do Kanban; as outras 6 batem com eventos já cadastrados (Transcurso de validade, Embalagem Comercial, Avaria na Entrega, Atraso na entrega, Falta na Entrega, Desvio de qualidade) e viraram checklist de evento. A lista "Entrega" (sem correspondência) foi descartada; as outras 4 etapas do Kanban ficam sem checklist até Caio fornecer o conteúdo.

## 2026-08-20 · SQL — Migração 0011 (checklist de tarefas)
Duas tabelas novas: `tarefas_padrao` (lista fixa por contexto kanban/evento + chave, editável só por admin) e `processo_tarefas` (snapshot da lista no processo, marcada como concluída pela equipe — não muda retroativamente se `tarefas_padrao` mudar depois). Triggers de `registrar_kanban_historico`/`registrar_tag_historico` estendidos pra gerar o checklist automaticamente a cada entrada de etapa/ativação de evento. Marcar uma tarefa como concluída gera um andamento automático (trigger `registrar_tarefa_andamento`), igual ao comportamento do protótipo. "Concluir etapa" não trava por tarefa pendente (mesmo comportamento do protótipo). Backfill gera checklist pros processos/eventos já ativos antes desta migração.

## 2026-08-20 · Marco — Estrutura bruta fechada
Todas as telas e funcionalidades combinadas pra essa fase estão no ar em produção: processos (CRUD, kanban, tags/eventos, andamentos, cobertura de férias), fornecedores, coordenações, painel/dashboard e Sentry. Próxima etapa combinada com Caio: passar por um design (visual) antes da auditoria de segurança final (Etapa 6 da metodologia), que continua sendo o requisito pra liberar dados reais no sistema.