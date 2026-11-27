# Funcionalidades — CRM-COFISC (AS-IS)

> Telas, campos e ações reais, por arquivo. Classificação: **operacional** (funciona de ponta a ponta, ligado a dado real), **parcial** (existe mas incompleto/condicional/placeholder), **inexistente** (mencionado em algum lugar — migração, comentário, campo — mas sem tela/lógica real). `/design-lab` e telas de exemplo já documentadas em `docs/design/` — não repetidas aqui.

## Contratos (`app/processos/`) — núcleo do sistema

**`/processos`** (`page.tsx`) — servidor: carrega lista com joins (coordenação, fornecedor, responsável, tags), agendamentos/tarefas pendentes, parcelas atrasadas, último andamento por contrato. Calcula por contrato: próximo evento, tarefas agendadas, próxima/atrasada entrega, `relatorioDesatualizado`, cor de status (gradiente/sólido), anel de execução física. **Operacional.**

Três visualizações (`visualizacoes.tsx`, `?visao=`):
- **Lista** (`lista.tsx`): filtros (coordenação, forma de entrega, evento/tag, responsável, etapa, busca full-text debounce 200ms, chips "só atrasados"/"só desatualizados", aba Ativos/Concluídos). Criação inline de etapa/evento. Card: pill de etapa, pills de atraso/relatório, objeto, NUP+copiar, coordenação, fornecedor, anel de execução física (`MedidorCircular`), eventos agendados, próxima/atrasada entrega, tags, último andamento (2 linhas). Linha tingida verde/âmbar conforme cobertura de férias. Usa View Transitions API do navegador pra abrir o contrato (no-op gracioso se não suportado). **Operacional.**
- **Kanban** (`kanban.tsx`): drag-and-drop HTML5 nativo entre colunas (`kanban_colunas`); soltar escreve `processos.etapa_atual`. **Operacional.**
- **Por prazo** (`por-prazo.tsx`): contratos ativos com `prazo_data`, ordenados; sem prazo ficam contados mas fora da lista ordenada. **Operacional.**

**`/processos/novo`** (`form.tsx`, 817 linhas): cria contrato + itens em sequência (duas inserções sequenciais, **não é transação real** — ver `GAPS.md`). Campos: número do contrato, NUP, objeto, unidade de medida, coordenação, fornecedor (com "+ Novo Fornecedor" inline), titular/responsável com toggle "em cobertura" (exige substituto + motivo), forma de entrega, gestor+substituto, fiscal+substituto (com "+ Novo Gestor/Fiscal" inline, matrícula, checagem de duplicidade via `lib/verificar-pessoa-duplicada.ts`). **Múltiplos itens**: lista dinâmica (`itens[]`) com descrição/CATMAT/unidade/quantidade/valor unitário; salva em `processo_itens` após o contrato existir; se vazio, cria 1 item automático a partir do Objeto. Upload de PDF/imagem/xlsx dispara `/api/processos/extrair-pdf`, pré-preenchendo tudo acima mais ~28 campos de "quadro resumitivo" (não mostrados neste form) e, se presente, cronograma de parcelas por item. **Operacional**, com ressalva de atomicidade (ver `GAPS.md`).

### Tela do contrato (`app/processos/[id]/`)

Casca servidor (`page.tsx`) → `painel.tsx` (cabeçalho/breadcrumb/etapa) + `conteudo.tsx` (orquestrador de abas via `abas.tsx`).

| Sub-tela | Arquivo | Resumo | Status |
|---|---|---|---|
| Dados principais / Dados do processo | `dados-principais.tsx`, `dados-processo.tsx` | Leitura/edição completa de `processos` com coordenação, fornecedor, titular/responsável, gestor+substituto, fiscal+substituto (matrícula, e-mail, ramal, ausência) | Operacional |
| Etapas | `etapas.tsx` | Seletor de etapa por contrato, escreve `etapa_atual` + `processo_kanban_historico` | Operacional |
| Checklist | `checklist.tsx` (722 linhas) | Lista de tarefas (`processo_tarefas`), reordenável (drag → `ordem` em lote), agendável, tagueável, anotável. É a feature "múltiplas etapas por contrato (checklist c/ data)" | Operacional |
| Agendamentos | `agendamentos.tsx` | `processo_agendamentos` (data+hora), separado do checklist; alimenta Agenda e "próximo evento" | Operacional |
| **Cronograma** | `cronograma.tsx` (1498 linhas — maior arquivo da feature) | CRUD completo de **itens**+**parcelas**+**lançamentos** (ver `DATA_MODEL.md`). Avaria/desvio como lançamento sinalizado, resolvido por lançamento-filho ("reposição"). Fluxo "entrega ocorreu?" com sub-etapa de problemas. Anexo auto-extrai itens/parcelas | Operacional — parte mais ativamente mantida do sistema |
| Gestão e fiscalização | `gestao-fiscalizacao.tsx` | Gestor/fiscal + substitutos com status de ausência | Operacional |
| Cobertura / Concluir cobertura | `cobertura.tsx`, `concluir-cobertura-botao.tsx` | Mostra "responsável atual ≠ titular"; botão limpa (`responsavel_atual_id = titular_id`) | Operacional |
| Conclusão / Concluir contrato | `conclusao.tsx`, `concluir-contrato-botao.tsx` | `situacao="concluido"` + tipo/checks/texto/penalidade | Operacional |
| Andamentos | `andamentos.tsx` (621 linhas) | Linha do tempo livre (`andamentos`), tags via slash-command, anexos (Storage), toggle "incluir no relatório", agendamento, botão "melhorar com IA" → `/api/ai/reformular-andamento` | Operacional |

### Aba Relatório

| Sub-tela | Arquivo | Resumo | Status |
|---|---|---|---|
| **Quadro resumitivo** | `quadro-resumitivo.tsx` (859 linhas) | ~28 campos em `processos`: nº Processo Eletrônico, Objeto, Data de assinatura, {Pregão, Ata, Contrato}×{nº, nº SEI, publicação DOU nº+SEI, publicação PNCP data+SEI} (12 campos pareados), Vigência início/fim, Valor unitário/global/garantia (cada um também "por extenso", `lib/extenso.ts`), Portaria de designação do fiscal+SEI, CATMAT, **Nota de Empenho nº** (campo livre único), Programa de Trabalho, Natureza de Despesa, Local de Entrega. Lista itens inline. Auto-preenche na extração só quando o campo ainda está vazio | Operacional como superfície de dado; **"Nota de Empenho" é só armazenamento** — sem vínculo com parcela/valor/data |
| Cronograma relatório | `cronograma-relatorio.tsx` | Tabela-resumo somente leitura do Cronograma, pro PDF | Operacional |
| **Pauta de distribuição** | `pauta-distribuicao.tsx` (386 linhas) | Plano por UF (`processo_pauta_distribuicao`: uf, quantidade, data_entrega, link opcional a parcela), editável inline, extraível por IA. Só serve pra calcular atraso/faltante em "Dados de entrega" | Operacional |
| **Dados de entrega** | `dados-entrega.tsx` (428 linhas) | Ledger por remessa (`processo_entregas`: local/UF, quantidade, valor NF, DANFE venda/remessa, **lote**, datas de fabricação/validade/entrega, responsável), medidor semicircular de "transcurso médio de validade", atraso/faltante por linha. Extraível por anexo, append-only na importação | Operacional |
| **Ocorrências** | `ocorrencias.tsx` (479 linhas) | **Não é tabela própria** — são linhas de `andamentos` com `tipo="Ocorrência"` e `incluirRelatorio=true`; fluxo de combinar várias em uma ou manter separadas, edição/exclusão inline | Operacional, mas é uma *view* sobre Andamentos (ver `GAPS.md`) |
| Status do relatório | `status-relatorio.tsx` | Mostra/define `relatorio_atualizado_em`, alimenta `relatorioDesatualizado` em todo o sistema | Operacional |
| **PDF** | `relatorio/pdf/page.tsx` + `documento.tsx` | Compila tudo acima num documento imprimível | Operacional, **exceto Pagamentos — ver abaixo** |

**Achado explícito**: `documento.tsx` contém o placeholder literal **"[Espaço reservado — módulo de pagamentos ainda não construído.]"** em 3 pontos (linhas 397, 424, 712). **Pagamentos é INEXISTENTE como funcionalidade** — só existem os campos de texto livre `nota_empenho_numero` e `responsavel_pagamento_nome/email`, sem rastreamento/conciliação financeira. "Conclusões ainda não definidas." é o estado vazio equivalente para Conclusão.

## Dashboard (`app/dashboard/`)

Dashboard real, com dado de verdade (distinto do protótipo Liquid Glass em `/design-lab`, ver `docs/design/`). KPIs: contratos por etapa Kanban sem `saida_em`, contagem de tags de evento ativas, agendamentos de hoje, tarefas pendentes/atrasadas, parcelas atrasadas. **Ordem de widgets customizável por pessoa** (`painel_layout.ordem_widgets`, padrão `["kpis","coordenacao","entregas","agenda","graficos","parados"]`). **Operacional.**

## Fornecedores / Gestores e Fiscais / Coordenações / Tags

- **Fornecedores**: nome, CNPJ, preposto, telefone, múltiplos e-mails (`fornecedor_emails`, botão copiar-todos), lista de contratos vinculados. **Operacional.**
- **Gestores e Fiscais**: na branch de trabalho auditada, unificados em `/gestores` (lista+form compartilhados, `app/_pessoas-papel/`), com `/fiscais`/`/fiscais/novo`/`/gestores/novo` como redirecionamentos. **Correção (`docs/audit/BRANCH_SYNC.md`)**: essa unificação é um commit só da branch de trabalho (`c5314dd`, "CRM Premium — Etapa 2"), **não confirmado em produção** — o deploy atual (`origin/main`) mantém `/fiscais` e `/gestores` como páginas completas e separadas (cada uma com sua própria consulta `pessoa_papeis.papel = 'fiscal'|'gestor'`), e recebeu correções de bug próprias nesse formato depois do ponto em que a branch se separou (ver `BRANCH_SYNC.md` seção 3). Mostra período de ausência por pessoa nos dois casos. **Operacional** (em ambas as versões, separadamente).
- **Coordenações**: sigla, nome, telefone, coordenador nome/e-mail, mais `pessoa_papeis` (coordenador/substituto/equipe). **Operacional.**
- **Tags**: categoria/valor/cor/ativo, com contexto de contagem (contratos abertos, agendamentos de hoje). **Operacional.**

## Dados, Avisos, Agenda

- **`/dados`**: agrega `processos`, `processo_tag_historico`, `processo_kanban_historico` (tempo por etapa), `processo_entregas`, `processo_pauta_distribuicao` pra analytics. `xlsx` **não** é usado aqui — só em `lib/ia-anexo.ts` pra leitura de anexo antes da extração por IA; **não há exportação para Excel apesar da dependência estar instalada** (ver `GAPS.md`).
- **`/avisos`**: leitor de `alertas_sistema` (tabela gerada pelo sistema, ver `WORKFLOWS.md`). **Operacional como visualizador.**
- **`/agenda`**: visões de calendário sobre agendamentos/tarefas/andamentos. Contém a mensagem explícita **"Exportação pro Google Calendar ainda não configurada (variáveis de ambiente pendentes)"** (`app/agenda/page.tsx:188`) — o código de sincronização existe (`lib/google-calendar.ts`, `app/api/google/*`) mas é **parcial**: condicionado a variáveis de ambiente não configuradas em pelo menos alguns ambientes — "implementado mas condicionalmente inativo", não quebrado.
