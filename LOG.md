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

## 2026-08-20 · Acerto a repetir — Migração 0011 confirmada
Caio testou trocar etapa e ativar evento em produção depois de rodar o SQL — sem erro, triggers estendidos funcionando normal.

## 2026-08-20 · Acerto a repetir — Checklist de tarefas confirmado
Deploy testado e confirmado por Caio: marcar tarefa como concluída funciona e gera andamento automático.

## 2026-08-20 · Acerto a repetir — Telas de Gestores e Fiscais
Criadas `/gestores` e `/fiscais` (lista) + `/gestores/novo` e `/fiscais/novo` (criação, admin-only), reaproveitando um componente compartilhado (`app/_pessoas-papel/`, pasta privada do App Router — não vira rota) já que as duas telas são idênticas, só muda o papel. Sem migração nova: usa `pessoas` + `pessoa_papeis`, que já existiam desde a Etapa 2 e nunca tinham UI. Cadastro pede nome/matrícula/e-mail (e-mail é obrigatório no banco, mas não aparece na lista) + coordenação.

## 2026-08-20 · Acerto a repetir — Gestores e Fiscais confirmados
Deploy testado e confirmado por Caio: cadastro de gestor e fiscal funcionando, aparecendo na lista com a coordenação certa.

## 2026-08-20 · Acerto a repetir — Gestor/Fiscal vinculados ao processo
Formulário de novo processo ganhou 4 campos (Gestor/Gestor substituto/Fiscal/Fiscal substituto), opções filtradas pela coordenação selecionada. Painel do processo ganhou seção "Gestão e Fiscalização" com os mesmos 4 campos, editável a qualquer momento. Todos os 4 campos opcionais (não bloqueiam criação do processo se ainda não houver gestor/fiscal cadastrado pra coordenação) — decisão pra não travar o fluxo, revisitar se virar problema.

## 2026-08-20 · Acerto a repetir — Checklist no painel do processo
Painel do processo ganhou seção "Checklist": um grupo por etapa/evento ativo, com as tarefas de `processo_tarefas` (marcar/desmarcar concluída, contagem "X/Y tarefas"). Marcar como concluída já dispara o andamento automático (trigger da migração 0011). Sem migração nova — só leitura/escrita no que já existe.

## 2026-08-20 · Marco — Estrutura bruta fechada
Todas as telas e funcionalidades combinadas pra essa fase estão no ar em produção: processos (CRUD, kanban, tags/eventos, andamentos, cobertura de férias), fornecedores, coordenações, painel/dashboard e Sentry. Próxima etapa combinada com Caio: passar por um design (visual) antes da auditoria de segurança final (Etapa 6 da metodologia), que continua sendo o requisito pra liberar dados reais no sistema.

## 2026-08-21 · Falha corrigida — esqueci de mandar o SQL da migração 0010
Depois de escrever a migração 0010 (campos do relatório, gestor/fiscal, execuções), mandei o zip do código mas não o arquivo `.sql` pro Caio rodar no Supabase — só lembrei da 0011 depois. Resultado: a query de detalhe do processo (que já usava as colunas novas) quebrava com erro de schema, e o Next.js mostrava 404 genérico em vez do erro real, mascarando a causa. Lição: sempre que uma migração for gerada, checar explicitamente que o SendUserFile do `.sql` foi feito antes de seguir pra próxima etapa — não confiar só em lembrar.

## 2026-08-21 · Acerto a repetir — Migração 0010 e vínculo gestor/fiscal confirmados
Caio rodou o SQL 0010 e confirmou: detalhe do processo abre normal, campos de gestor/fiscal (novo processo + painel) funcionando.

## 2026-08-21 · Acerto a repetir — NUPs nomeados no painel
Painel do processo ganhou seção "NUPs": NUP Relatório e NUP Pagamentos, editáveis (NUP Principal continua vindo direto de `processos.nup_principal`, já mostrado no topo — não duplicado em `processo_nups`). Sem migração nova, tabela `processo_nups` já existia com o campo `tipo` certo.

## 2026-08-21 · Decisão — Detalhe do fornecedor com aba Contratos
Criada `/fornecedores/[id]` (não existia detalhe, só lista e cadastro): dados do fornecedor + tabela de contratos (processos daquele fornecedor com valor global, vigência, etapa, situação), linkando pra `/processos/[id]`. Sem migração nova — só leitura de `processos` filtrada por `fornecedor_id`. Lista de fornecedores passou a linkar o nome pra essa tela nova.

## 2026-08-21 · Falha corrigida — conexão GitHub sem permissão de escrita
`git push`/API do GitHub retornavam `403 Resource not accessible by integration` desde o início do projeto. Causa raiz: o "Claude" que aparecia em Settings → Connectors do Caio era só uma autorização OAuth de identidade (aba "Authorized GitHub Apps" no GitHub, "Never used"), não uma instalação do GitHub App com permissão de conteúdo — por isso nunca aparecia em "Installed GitHub Apps" e reconectar não mudava nada. Solução: instalar o app dedicado em github.com/apps/claude, selecionando só o repositório CRMCOFISC (não "All repositories", por princípio de menor privilégio). Depois da instalação, `git push` passou a funcionar normalmente. Fluxo de zip manual (Etapa adotada em 2026-08-17) não é mais necessário a partir de agora — push direto disponível.

## 2026-08-21 · Acerto a repetir — Filtros na lista de processos
Tela `/processos` ganhou filtros (coordenação, forma de entrega, evento, responsável atual, SEI preenchido/vazio) — filtragem client-side sobre a lista já carregada (volume pequeno, mesmo padrão do "dias parado" do dashboard). "Evento" filtra por tag ativa em `processo_tags`; "SEI" reaproveita `processo_eletronico_numero` preenchido, sem coluna própria. Sem migração nova. Confirmado por Caio em produção.

## 2026-08-21 · Acerto a repetir — Quadro Kanban
Nova tela `/kanban`: colunas pelas 5 etapas, cards com contrato/coordenação/fornecedor, barra de progresso do checklist (tarefas concluídas/total da etapa ativa) e botão "Concluir etapa" (avança pra próxima coluna na ordem fixa; some na última etapa, já que não existe mais "Concluído" no kanban). Não trava por tarefa pendente, igual ao protótipo. Sem migração nova — reaproveita `processos.etapa_atual`, `processo_kanban_historico` e `processo_tarefas`.

## 2026-08-21 · Falha corrigida — deploy quebrado por arquivo esquecido no payload
Ao deployar os filtros de processos direto via API do Vercel (sem passar pelo GitHub), esqueci de incluir `app/processos/lista.tsx` no array de arquivos — só mandei o `page.tsx` que importa ele. Build quebrou com "Module not found: Can't resolve './lista'". Corrigido reenviando o payload completo (42 arquivos) com o arquivo faltante. Lição: ao montar manualmente o payload de deploy, contar os arquivos antes de enviar e conferir que todo import novo tem seu arquivo correspondente na lista.

## 2026-08-21 · Decisão — deploy no Vercel via agente em background, com checagem de contagem
Depois do erro acima, deploys direto pela API do Vercel (fora do fluxo normal de git) passaram a ser delegados a um agente em background com instrução explícita de contar os arquivos (`git ls-files` filtrado) antes de montar o payload e conferir a contagem bate antes de chamar a ferramenta de deploy — evita o erro de arquivo esquecido de forma mais confiável que montar o payload manualmente.

## 2026-08-21 · Acerto a repetir — Kanban: mover card livremente (drag-and-drop)
Caio pediu poder mover os cards do Kanban livremente, não só avançar pela ordem fixa. Adicionado arrastar-e-soltar nativo (HTML5 drag/drop, sem biblioteca externa): qualquer card pode ser solto em qualquer coluna, inclusive voltando etapa. Botão "Concluir etapa" mantido como atalho/alternativa sem mouse. Mesma mutação de antes (`processos.etapa_atual`), sem migração nova.

## 2026-08-21 · Decisão — Relatório dividido em 6 etapas
Protótipo original lido por completo (Google Drive) pra extrair a especificação exata da aba "Relatório": timbre oficial, 8 seções numeradas, quadro resumitivo (24 campos), cronograma, execução (pauta de distribuição por UF + log de entregas com 12 campos), ocorrências com 7 modelos de texto fixos (lacunas), conclusões (Regular/Irregular + checklist + texto), e exportação em PDF via impressão. Escopo grande demais pra uma etapa só — dividido em 6 sub-etapas aprovadas por Caio: (1) Quadro resumitivo, (2) Cronograma de entrega, (3) Execução do contrato, (4) Andamentos com modelos, (5) Conclusões, (6) Exportação PDF.

## 2026-08-21 · SQL/Acerto — Relatório (1/6): Quadro resumitivo
Nova tela `/processos/[id]/relatorio`. Migração 0012 adiciona só 2 colunas novas (`quantidade_contratada`, `data_assinatura`) — os outros ~22 campos do quadro já existiam (0001 ou 0010). Editável em bloco (todos os campos de uma vez, Salvar/Cancelar), exceto Gestor/Fiscal e Empresa/CNPJ, que ficam só leitura aqui (edição continua na seção "Gestão e Fiscalização" e no cadastro do fornecedor, pra não duplicar caminho de edição e arriscar inconsistência). Valor Unitário/Global/Garantia mostram o valor por extenso automaticamente (`lib/extenso.ts`, conversor número→português escrito à mão, sem dependência nova — vale conferir a redação antes de usar num documento oficial). Ordem visual dos campos no grid é agrupada por tipo, não idêntica à ordem exata do protótipo (decisão de simplicidade, sem prejuízo de conteúdo). "Forma de entrega: Descentralizada/Centralizada" do protótipo foi deixado de fora por ora — pertence conceitualmente à Etapa 3 (Execução/Pauta de Distribuição).

## 2026-08-21 · SQL/Acerto — Relatório (4/6): Andamentos com modelos de texto
Seção "Andamentos" do processo ganhou os 7 modelos fixos do protótipo (Ofício Atenção, Notificação Atraso, Autorização Transcurso, Carta Defesa Prévia, Avaria, Conclusão Regular, Outro) — dropdown de tipo (antes texto livre) + botão "Gerar com IA" que só substitui `[X]` pelo número do contrato (igual ao protótipo, não chama IA de verdade — as outras lacunas `[Nº]`, `[SEI]`, `[data]` etc. continuam manuais). Cada andamento ganhou toggle "Incluir no relatório" e botão copiar. Migração 0015 adiciona `incluir_relatorio` em `andamentos`. Aba Relatório ganhou seção "Ocorrências" (5) mostrando só os andamentos marcados, ou aviso de nenhum marcado — edição continua só no processo, mesmo padrão do Cronograma/Execução.

## 2026-08-21 · Falha corrigida — deploy automático ficava preso em "preview", nunca produção
Depois de conectar o Git, todo push virava deploy READY mas com `target: null` (preview), nunca `production` — o domínio `crmcofisc.vercel.app` não atualizava sozinho. Causa prática: a branch de produção configurada na Vercel não acompanhou nossa branch de trabalho automaticamente. Tentativas que não resolveram: trocar o branch padrão no GitHub, desconectar/reconectar o Git na Vercel. O que resolveu: Caio achou e ajustou a configuração de "Production Branch" direto na Vercel (via busca na página de Settings → Git). A partir daí, `git push` passou a gerar deploy de produção sozinho, confirmado com dois commits de teste.

## 2026-08-21 · Acerto a repetir — Relatório (3/6): Execução do contrato confirmado
Pauta de distribuição e Dados de entrega testados por Caio em produção, funcionando.

## 2026-08-21 · SQL/Acerto — Relatório (3/6): Execução do contrato
Aba Relatório ganhou "Execução do contrato": Pauta de distribuição (UF de destino + quantidade, com "Forma de entrega: Descentralizada/Centralizada" calculado — não virou coluna própria, é derivado de quantas UF têm registro) e Dados de entrega (12 campos do protótipo: local, quantidade, valor da NF, DANFE venda/remessa, lote, datas de fabricação/validade/entrega, responsável, atraso em dias, % de transcurso). Migração 0014 cria `processo_pauta_distribuicao` e `processo_entregas`, RLS igual `processo_execucoes` (equipe lê/escreve, sem restrição a admin). Atraso e % de transcurso ficaram como preenchimento manual nessa etapa — protótipo sugeria cálculo automático, mas a referência pra esse cálculo (contra qual parcela do cronograma) não estava clara o suficiente pra implementar sem adivinhar; marcado na tela que são campos manuais por enquanto.

## 2026-08-21 · Falha corrigida — deploy automático via Git quebrou (Framework Preset)
Primeiro deploy disparado pela integração Git↔Vercel falhou: "No Output Directory named public found" — o preset de Framework nunca tinha sido salvo nas configurações do projeto (só passado manualmente em cada deploy via API). Corrigido por Caio em Project → Settings → General → Build & Development Settings → Framework Preset → Next.js.

## 2026-08-21 · Acerto a repetir — Cronograma: editar linha + data de entrega + atraso
Caio pediu poder editar quantidade/unidade/prazo de uma parcela já cadastrada (antes só dava pra mudar a situação ou remover), e um campo "Data entregue" que, quando preenchido, calcula automaticamente o atraso em dias (`data_entrega - data_prevista`, nunca negativo — entrega antecipada ou no prazo mostra 0). Migração 0013 adiciona `data_entrega` em `processo_execucoes`. Cálculo de atraso é derivado na tela (não fica salvo no banco), reaproveitado tanto no Cronograma do processo quanto no resumo do Relatório.

## 2026-08-21 · Decisão — Deploy no Vercel passa a ser manual/automático por Caio
Deploys manuais via agente em background (chamando a API do Vercel diretamente) se mostraram frágeis nesta sessão: falha de arquivo esquecido no payload, um agente que enviou conteúdo minificado/corrompido pra um arquivo, e um agente que bateu limite de sessão no meio do trabalho. Caio conectou o repositório GitHub diretamente ao projeto Vercel (Settings → Connect Git), o que deve automatizar o deploy a cada `git push` daqui pra frente — Caio também assumiu manualmente qualquer ajuste necessário no Vercel/Supabase/GitHub, tirando essa etapa das minhas mãos.

## 2026-08-21 · Acerto a repetir — Relatório (2/6): Cronograma de entrega
Painel do processo ganhou seção "Cronograma de entregas" (CRUD completo: adicionar/remover/editar situação sobre `processo_execucoes`, que já existia desde a migração 0010 sem UI). Aba Relatório reaproveita os mesmos dados, só reformatados (Parcela/Quantitativo/Prazo máximo + linha TOTAL), sem tabela duplicada — conforme simplificação combinada com Caio. Sem migração nova.

## 2026-08-21 · Decisão/SQL-livre — Exportação de prazos pro Google Calendar (link .ics)
Caio pediu integração com o Google Calendar. Decidido: só exportação (CRM → Google), via link .ics assinável — mesmo mecanismo que ele já usa hoje com o Power-Up de Calendário do Trello (confirmado com ele: Google "puxa" a URL periodicamente, sem OAuth). Rota `GET /api/agenda.ics?token=...` gera o feed a partir de `processos.prazo_data`. Como a rota não tem sessão de usuário (é o Google acessando, não o Caio logado), precisa de dois segredos novos, só como env var no Vercel (nunca no código): `SUPABASE_SERVICE_ROLE_KEY` (ignora RLS, necessário pra ler sem login — uso restrito a essa rota) e `AGENDA_ICS_TOKEN` (token aleatório que protege a URL, já que ela fica pública o suficiente pro Google acessar). Sem essas duas variáveis configuradas, a rota responde 403 e a tela `/agenda` avisa que a exportação não está ativa — nada quebra. Pendência: Caio precisa colar as duas nas envs do Vercel (não tenho ferramenta pra fazer isso automaticamente, nem pra buscar a service_role key do Supabase).

## 2026-08-21 · Acerto a repetir — Campo de prazo editável + título do evento no formato pedido
Painel do processo ganhou seção "Prazo" (editar `prazo_data`, antes só dava pra popular via banco). Título do evento no feed .ics ajustado pro formato pedido por Caio: "CT nº {número do contrato} - {etapa atual}" (ex.: "CT nº 234/2026 - Aguardando Assinatura"). Confirmado com Caio que `numero_contrato` já é cadastrado só como número/ano (ex. "234/2026"), sem prefixo "CT".

## 2026-08-21 · Decisão — integração Supabase↔GitHub instalada, auto-deploy de migrations NÃO ativado pra nós
Caio instalou a integração oficial Supabase↔GitHub↔Vercel. Ela vem com "Deploy to production" ligado por padrão, sincronizando a pasta `supabase/` com uma branch (hoje configurada como `main`). Como todo nosso desenvolvimento roda na branch `claude/crm-cofisc-conexao-9pot1u` (não a `main`), isso não afeta nada agora. Caio cogitou apontar o campo "Production branch name" pra nossa branch de trabalho, o que ativaria aplicação automática de toda migração `.sql` no banco de produção a cada `git push`, sem revisão manual — decidido que NÃO, mantendo o fluxo manual atual (SQL sempre entregue como arquivo pra Caio rodar) até pelo menos a auditoria de segurança final (Etapa 6). Risco identificado: sem revisão antes da execução, sem CI/staging no projeto, e migração malfeita pode ser irreversível (diferente de um deploy de código com bug, que só se corrige e reenvia).

## 2026-08-21 · Decisão — Agenda: calendário mensal
Nova tela `/agenda`: calendário mensal (navegação anterior/próximo/hoje) mostrando os processos cujo `prazo_data` cai em cada dia, cada um linkando pro processo. Sem biblioteca de calendário externa — grid construído na mão (dia da semana do dia 1 do mês + dias no mês). Sem migração nova, `prazo_data` já existia desde a migração 0010.

## 2026-08-24 · Falha corrigida — deploy de produção "preso em preview" voltou a acontecer
O ajuste de "Production Branch" do dia 21 não se mostrou definitivo: o push seguinte (commit `57d14e9`, Andamentos com modelos) gerou de novo um deploy `READY` com `target: null`. Caio promoveu manualmente pra produção (Deployments → "..." → Promote to Production), confirmado por `target: "production"` no deploy `dpl_8w6NcArTBNRQFfEcjyUhQfem6myh`. Causa raiz definitiva ainda não identificada — assumido por ora como workaround recorrente (promover manualmente a cada push), já que a configuração de Vercel ficou a cargo do Caio.

## 2026-08-24 · Acerto a repetir — Relatório (4/6): Andamentos com modelos de texto confirmado
Caio testou em produção (após promoção manual acima): dropdown de tipos, "Gerar com IA" substituindo `[X]` pelo número do contrato, toggle "Incluir no relatório" e reflexo na seção "Ocorrências" do Relatório — tudo funcionando.

## 2026-08-24 · Acerto a repetir — Relatório (5/6): Conclusões confirmado
Caio testou em produção (deploy precisou de promoção manual de novo — mesmo bug recorrente do dia 21/24): botões Regular/Irregular preenchendo checklist e texto padrão, edição/remoção de item, texto livre, sugestão de penalidade, Salvar persistindo, e espelho na aba Relatório — tudo funcionando.

## 2026-08-25 · SQL/Decisão — Gestor/Fiscal: cadastro simplificado (só nome + matrícula)
Caio pediu pra tirar Coordenação e E-mail do cadastro de gestor e fiscal (confirmado "dos gestores também", não só fiscal) — só nome completo e matrícula. Migração 0017 torna `pessoa_papeis.coordenacao_id` e `pessoas.email` opcionais (`drop not null`, não removidas as colunas — mudança não destrutiva, cadastros antigos mantêm os valores que já tinham). `_pessoas-papel/form.tsx` (usado por Gestores e Fiscais) perdeu os campos Coordenação e E-mail. Efeito em cascata: como gestor/fiscal não tem mais coordenação, os dropdowns de Gestor/Fiscal (+ substitutos) na criação de processo e no painel do processo pararam de filtrar por coordenação — agora listam todos os gestores/fiscais cadastrados, independente da coordenação do processo. Coluna "Coordenação" removida da listagem de Gestores/Fiscais. Caio esclareceu que, se faltar gestor/fiscal na hora de abrir um processo, ele cadastra na hora (telas `/gestores/novo` e `/fiscais/novo` já existentes) e o cadastro fica disponível pros próximos processos.

## 2026-08-25 · SQL/Decisão — Contatos por coordenação (pessoas de área técnica)
Caio confirmou: são contatos dentro das 3 coordenações já existentes (CGCEAF/CGAFME/CGAFB, tabela `coordenacoes`), cada uma com pessoas/e-mails/ramais diferentes — não é um conjunto novo de coordenações. Migração 0018 cria `coordenacao_contatos` (coordenacao_id, nome, email, ramal), RLS igual `fornecedor_emails` (select liberado pra equipe, insert/update/delete só admin — mesmo padrão de dado mestre). Nova tela `/coordenacoes/[id]` (detalhe, não existia antes — só lista e criação): mostra a coordenação e a lista de contatos, cada um com nome/e-mail/ramal e botão "copiar" em cada campo + um "copiar tudo" formatado (nome — coordenação (sigla) — e-mail — ramal), pra facilitar encaminhar e-mail. Adicionar/remover contato restrito a admin, mesmo padrão de fornecedores/coordenações. Lista de Coordenações agora linka a sigla pra essa tela nova.

## 2026-08-25 · Decisão — Design (4/N): cadastros (Fornecedores, Coordenações, Gestores, Fiscais, Novo processo)
Listas de Fornecedores, Coordenações e Gestores/Fiscais (componente compartilhado `_pessoas-papel/lista.tsx`, cobre as duas telas de uma vez) ganharam tabela em card e botão "+ Novo" em destaque (pílula escura). Detalhe do fornecedor ganhou cabeçalho em card. Formulários de criação (Novo fornecedor, Nova coordenação, Novo gestor/fiscal via `_pessoas-papel/form.tsx`, Novo processo) ganharam moldura em card e botão de salvar em destaque — campos internos (labels/inputs) não foram alterados, já herdam o estilo do `globals.css` (Design 2/N). Links "← Voltar" redundantes com a navbar removidos das 3 listas de topo (mantido no detalhe do fornecedor, que não está na navbar). Sem migração, sem mudança de lógica.

## 2026-08-25 · Decisão — Design (3/N): Kanban + Agenda
Kanban: colunas com fundo neutro-quente (mesmo tom do fundo geral), cards brancos arredondados com sombra leve, barra de progresso na cor de status positivo, link "← Voltar" removido (redundante com a navbar). Agenda: link do .ics movido pra dentro de um card, calendário mensal também em card, células do dia com cantos arredondados, prazos do dia como pílula colorida em vez de bloco sólido vermelho. Nenhuma mudança de lógica/dado em nenhum dos dois — drag-and-drop do Kanban e navegação de mês da Agenda continuam iguais. Sem migração.

## 2026-08-25 · Falha corrigida — tabela do Cronograma estourava a margem do card
Após envolver as seções do painel do processo em cards (Design 2/N), a tabela de 8 colunas do Cronograma de entregas (execução/quantidade/unidade/datas/atraso/situação/ações) ficou mais larga que o card e vazava pela borda direita, sem barra de rolagem. Corrigido com `overflow-x: auto` no wrapper da tabela + `minWidth`, mesmo padrão já usado em Dados de entrega. Confirmado por Caio em produção.

## 2026-08-25 · Decisão — Design (2/N): estilo base global + Lista de processos + Painel do processo
`app/globals.css` (novo, importado no layout raiz) dá estilo padrão a `button`/`input`/`select`/`textarea`/`table` em todo o app — cantos arredondados, borda leve, foco âmbar — sem precisar editar cada um dos ~40 arquivos que usam esses elementos com estilo padrão do navegador; efeito imediato em qualquer tela ainda não redesenhada individualmente. Lista de processos (`/processos`) ganhou filtros em card, tabela em card com cabeçalho e etapa em pílula colorida. Painel do processo (`/processos/[id]`) ganhou cabeçalho em card com pílula de etapa, e cada seção (Cobertura, Painel, NUPs, Prazo, Gestão e Fiscalização, Cronograma, Checklist, Andamentos, Conclusões, históricos) agora é um card próprio, mesmo layout de conteúdo de antes — só o wrapper visual mudou, sem alterar lógica/comportamento de nenhum componente interno. Links "← Voltar" redundantes com a navbar removidos das duas telas. Sem migração.

## 2026-08-25 · Acerto a repetir — Design (1/N) confirmado
Caio testou em produção (deploy precisou de promoção manual de novo, mesmo bug recorrente): fonte Manrope aplicada globalmente, navbar funcionando em todas as telas logadas, Dashboard redesenhado (cards, barra de progresso, lista de parados) — tudo funcionando.

## 2026-08-25 · Decisão — Design (1/N): fundação + Dashboard
Início da fase de design visual. Reaproveitada a linguagem visual do próprio protótipo original (Claude Design), já aprovada por Caio quando o construiu: fonte Manrope (via `next/font/google`), fundo neutro-quente (#F8F4F4), cards brancos arredondados com sombra leve, paleta de status (verde #7E9B7E / âmbar #C08A3E / vermelho #B0655C) e botão escuro em pílula. Tokens centralizados em `lib/theme.ts` (cores, sombra, estilo de card/botão) pra reuso nas próximas telas, evitando repetir hexadecimais soltos. Criada `app/_nav/navbar.tsx`: barra de navegação persistente (Painel/Processos/Kanban/Agenda/Fornecedores/Coordenações/Gestores/Fiscais + Sair), no layout raiz, escondida em `/login`. `app/layout.tsx` aplica a fonte e o fundo globalmente — efeito imediato em todas as telas, mesmo sem redesenho de conteúdo ainda. Dashboard (`/dashboard`) redesenhado como primeira tela de exemplo: cards de estatística, barra de progresso por etapa, lista de processos parados com indicador colorido — lista de links soltos no rodapé removida (substituída pela navbar). Sem migração, sem mudança de dados/lógica.

## 2026-08-24 · Marco — Relatório (6/6) completo, estrutura do Relatório fechada
Caio testou em produção: documento gerado com timbre, título Parcial/Final, as 8 seções, lacunas editáveis, toggle da Seção 7, botões copiar, exportação via impressão — tudo funcionando. Com isso, as 6 etapas do plano do Relatório (Quadro resumitivo, Cronograma, Execução do contrato, Andamentos com modelos, Conclusões, Exportação PDF) aprovadas em 2026-08-21 estão concluídas e confirmadas. Junto com o marco anterior de 2026-08-20 (estrutura bruta do CRM), toda a estrutura funcional vista no protótipo original está no ar em produção. Próximos passos combinados: design visual (etapa deferida até a estrutura completa, que agora está pronta) e auditoria de segurança final (Etapa 6 da metodologia), que segue sendo o requisito pra liberar dados reais no sistema.

## 2026-08-24 · Decisão — Relatório (6/6): Exportação em PDF
Nova tela `/processos/[id]/relatorio/pdf`: documento único com timbre, título (Parcial/Final, alternável), as 8 seções numeradas do protótipo e assinatura do fiscal, exportável via botão "Exportar PDF" (`window.print()`, sem biblioteca de PDF). Seção 7 (Considerações sobre a Fiscalização de Contratos) tem os 6 parágrafos fixos do protótipo — são citações de normativos institucionais (Portaria GM/MS nº 78/2006, Lei 14.133/2021 etc.), não específicos de um contrato, então tudo bem fixar como texto padrão, com interruptor pra incluir/excluir (default ligado) igual ao protótipo. Cada seção tem botão "copiar" (clipboard), reaproveitando o padrão já usado em Andamentos/Conclusões — cobre o fluxo real de colar seção por seção no SEI, não só o PDF inteiro. Decisão importante: 3 trechos do protótipo (2. Local de Entrega, a introdução da 4. Execução do Contrato, e a linha de Referência/SEI no rodapé) continham números de documento/SEI específicos de um contrato de exemplo do protótipo (ex.: "(0053794055)", "Pauta de Distribuição nº (0055833356)", "SEI nº 0056283375") — não são boilerplate genérico, são dados de um caso real que só coincidentemente ficaram fixos no protótipo. Copiá-los verbatim pra todo contrato novo geraria referência de documento errada em relatório oficial. Substituídos por texto com lacunas `[SEI]`/`[Nº]`/`[data]`/`[trimestre]` (mesmo padrão dos modelos de Andamentos), editável ali mesmo na tela antes de exportar — não persiste no banco (é só o texto final de impressão, mesmo comportamento do protótipo original, que também não salvava). Sem migração nova. Aba Relatório ganhou link "Exportar PDF →".

## 2026-08-24 · SQL/Decisão — Relatório (5/6): Conclusões
Painel do processo ganhou seção "Conclusões": toggle Execução regular/Execução irregular (cada um preenche checklist + texto padrão do protótipo — trocar o tipo reinicia os dois, igual ao protótipo original), checklist com itens editáveis/removíveis (sem botão de adicionar item, igual ao protótipo — só os fixos do modelo), texto livre editável, campo opcional "Sugestão de penalidade" (só aparece se Irregular) e botão copiar (texto + penalidade, mesmo formato do protótipo). Migração 0016 adiciona 4 colunas em `processos` (`conclusao_tipo`, `conclusao_checks` array, `conclusao_texto`, `conclusao_penalidade`) — sem tabela nova, mesmo padrão de campo único por processo das demais seções do relatório. Sem mudança de RLS (`processos.update` já liberado pra equipe). Aba Relatório ganhou o espelho somente-leitura (seção "Conclusões", incluindo o parágrafo fixo do protótipo sobre responsabilidade da Contratada); assinatura do fiscal e demais elementos de documento final ficam para a Etapa 6 (exportação PDF).