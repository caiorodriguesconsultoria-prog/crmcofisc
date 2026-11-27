# Modelo de dados — CRM-COFISC (AS-IS)

> Reconstruído a partir das 50 migrações em `supabase/migrations/` (`0001` a `0050`, somente aditivas — nenhum `DROP` destrutivo fora dos documentados abaixo). Fonte: Postgres via Supabase. RLS ativo em todas as tabelas (ver seção própria).

## Tabelas mestras

| Tabela | Campos-chave | Observação |
|---|---|---|
| `coordenacoes` | sigla (único), nome, email_generico, telefone, coordenador_nome/email | |
| `pessoas` | nome, matricula (único, nullable), email (único, nullable desde 0017), ramal, `auth_user_id`→`auth.users`, is_admin, ativo, ausencia_inicio/fim (0039) | Uma linha = uma pessoa; `is_admin` é global (não é um papel em `pessoa_papeis`) — decisão original de arquitetura |
| `pessoa_papeis` | (pessoa_id, coordenacao_id nullable desde 0017, papel) | Modelo de **fiscais/gestores**: papel é por coordenação, não global. `papel` evoluiu: `0001` → coordenador/substituto/gestor/fiscal; `0030` acrescentou `responsavel` |
| `fornecedores` | nome, cnpj (único, nullable desde 0028), endereco, preposto, telefone, banco_conta | `email_comercial`/`email_logistica` **removidos** em `0009`, substituídos por `fornecedor_emails` (1:N) — normalização correta, não duplicidade |
| `tags` | (categoria, valor) único, cor (0026) | categoria evoluiu de `forma_entrega/natureza_ocorrencia` (0001) para `forma_entrega/evento` (0008) — lookup de criação livre, não enum fixo |

## Contrato (`processos`) e múltiplos itens

**`processos`** — entidade central, uma das tabelas mais alargadas do histórico de migrações: numero_contrato, nup_principal, objeto, coordenacao_id, fornecedor_id, valor_unitario/valor_global (hoje majoritariamente superados pelo valor por item, ver abaixo), vigencia_inicio/fim, etapa_atual (estágio Kanban, migrou de CHECK-enum pra FK livre via `kanban_colunas` em `0025`), titular_id/responsavel_atual_id→pessoas, situacao (em_execucao/prorrogado/concluido), `dados_complementares` jsonb (campo catch-all da migração `0001` — verificar se ainda é lido por algum código, candidato a órfão), campos de conclusão (0016), **mais ~35 colunas de Quadro Resumitivo** adicionadas entre `0010, 0012, 0029, 0037, 0043, 0044, 0045, 0050`.

Essa é efetivamente **uma tabela larga única carregando cabeçalho de contrato + Quadro Resumitivo + conclusão + prazo juntos** — candidata real a normalização, mas corresponde 1:1 ao schema JSON usado na extração por IA (`extrair-pdf/route.ts`) — é um design deliberadamente largo, não acidental.

**`processo_itens`** (0042) — **a tabela de "múltiplos itens"**: processo_id, numero (único por contrato), descricao, catmat, unidade_medida, quantidade, valor_unitario. Adicionada tardiamente; contratos pré-existentes foram retroativamente convertidos em "Item 1". Depois dessa migração, `processo_execucoes` (parcelas) passou a pertencer a um item, não diretamente ao contrato (a constraint única migrou de `(processo_id,numero)` para `(item_id,numero)`).

**`processo_nups`** — 1:N, tipo (principal/relatorio/pagamento/entrega — evoluiu em `0005`→`0031`), nup nullable, depois escopado a `execucao_id` (0031) e depois a `lancamento_id` (0035) para NUPs por parcela/lançamento.

## Fiscais, empenhos, parcelas, pautas, entregas, lotes, pagamentos

| Conceito pedido | Onde vive | Nota |
|---|---|---|
| **Fiscais** | `pessoa_papeis.papel = 'fiscal'` + colunas `fiscal_id`/`fiscal_substituto_id` em `processos` (Quadro Resumitivo) | Sem tabela própria — é um papel de pessoa, escopado por coordenação |
| **Empenhos** | Coluna única `processos.nota_empenho_numero` (texto livre) | **Sem tabela/estrutura própria** — não há vínculo com valor, data ou parcela. Ver `GAPS.md` e `BUSINESS_RULES.md` |
| **Parcelas** | `processo_execucoes` — item_id (FK, obrigatório desde 0042), numero, quantidade, unidade, data_prevista, situacao (enum, ver duplicidade abaixo), periodo (manhã/tarde, 0033) | Calendário de entrega por item |
| **Pautas** | `processo_pauta_distribuicao` — processo_id, uf, quantidade, data_entrega (0036), execucao_id (0036, link opcional a uma parcela específica) | Plano de distribuição por UF |
| **Entregas** | `processo_entregas` — processo_id, local_entrega, quantidade, valor_total_nf, danfe_venda/remessa, **lote**, data_fabricacao/validade/entrega, responsavel, atraso_dias/percentual_transcurso | Campo **"lote"** vive aqui. `atraso_dias`/`percentual_transcurso` existem na tabela mas o app recalcula ao vivo em vez de confiar no valor armazenado (`lib/entregas-derivados.ts`) — ainda ativamente lido/escrito por `app/dados`, `relatorio/dados-entrega.tsx`, `relatorio/pdf/page.tsx`, não órfão |
| **Lotes** | Campo `processo_entregas.lote` | Não é uma tabela própria, é uma coluna de identificação do lote dentro do registro de entrega |
| **Pagamentos** | `processos.responsavel_pagamento_nome/email` (0037) + NUP com `tipo="pagamento"` em `processo_nups`/`processo_entrega_lancamentos` | **Sem rastreamento financeiro real** — só identificação de responsável e número de processo. Ver `BUSINESS_RULES.md`/`GAPS.md` |
| **Ocorrências** | Não é tabela própria — são linhas de `andamentos` com `tipo = "Ocorrência"` e `incluir_relatorio = true` | Ver Andamentos abaixo |
| **Andamentos** | `andamentos` — processo_id, etapa_relacionada, tipo, texto, autor_id, data, sei_numero, incluir_relatorio (0015), agendamento_data/horario+google_event_id (0023), lembrete_enviado (0027) | + filhas `andamento_tags` (0023), `andamento_anexos` (0024) |
| **Relatórios** | Compilado a partir de `processos` + `processo_execucoes` + `processo_pauta_distribuicao` + `processo_entregas` + `andamentos` (filtro `incluir_relatorio`) | Sem tabela própria de "relatório" — é uma view/compilação, não uma entidade persistida |

## Ledger real de entrega: `processo_entrega_lancamentos`

(0035, estendida em 0038/0048) — é o ledger mais autoritativo que `statusParcela()` de fato lê (mais do que `processo_execucoes.situacao`): execucao_id XOR pauta_id (CHECK garante exatamente um), quantidade_normal/avaria/desvio, data_entrega (nullable desde 0038), tipo (total/parcial/avaria, padrão parcial), **lancamento_pai_id** (auto-FK — reposição/correção de uma avaria/desvio anterior do mesmo tipo, per `0048_reposicao_desvio.sql`, consumida por `lib/status-entrega.ts::temAvariaOuDesvioPendente`), data_limite, nup.

## Andamentos, tags e histórico

Três tabelas de tag estruturalmente idênticas para três entidades-pai diferentes: `processo_tags` (0005, contrato↔tag, com gatilho de histórico), `andamento_tags` (0023, andamento↔tag), `tarefa_tags` (0047, tarefa↔tag) — padrão repetido, não um bug (cada entidade-pai precisa de FK real), mas vale nota de disambiguação: são sistemas de marcação **distintos**, apesar do nome parecido.

Auditoria: `processo_kanban_historico`/`processo_tag_historico` (0008) — gatilhos `registrar_kanban_historico()`/`registrar_tag_historico()`, consumidos por `/dashboard` e `/dados` para analytics de "tempo na etapa".

## Checklist/tarefas

`tarefas_padrao` (modelo, contexto kanban|evento + chave) → `gerar_processo_tarefas()` (função plpgsql) materializa em `processo_tarefas` (processo_id, origem_tipo/origem_id, label, concluida, agendamento_data/horario (0020, periodo 0032), google_event_id, lembrete_enviado) + `processo_tarefa_observacoes` (0021) + `tarefa_tags` (0047).

`processo_etapas` (0046) — **independente** de `processos.etapa_atual`/Kanban (nome, data, ordem, concluida): um checklist livre com datas por contrato, não confundir com a etapa Kanban.

`processo_agendamentos` (0019) — agendamento de visita de entrega (data, horario, observacao, google_event_id, lembrete_enviado) — alimenta `agenda.ics` e a contagem "hoje" do Dashboard.

## Outras tabelas

- `kanban_colunas` (0025) — substitui o enum CHECK original de `etapa_atual` por um lookup ordenável via FK.
- `google_calendar_tokens` — singleton (id=1 fixo), refresh_token/access_token/expiry.
- `push_subscriptions` (0027) — pessoa_id, endpoint (único), p256dh, auth.
- `alertas_sistema` (0040) — contexto, mensagem, created_at — log de erro do sistema, escrito por `lib/alerta-erro.ts`.
- `painel_layout` (0049) — pessoa_id (PK), ordem_widgets jsonb — ordem de widgets do Dashboard por usuário.

## RLS

Duas funções `security definer` reutilizadas como predicado em praticamente toda política, em todas as 50 migrações: `is_authorized()` (qualquer pessoa ativa) e `is_admin()`. Definidas uma única vez em `0002_rls.sql` — não duplicadas por tabela.

`sql/auditoria_rls.sql` — consulta de auditoria **somente leitura** (lista tabelas + RLS ligado/desligado + políticas), feita pra rodar manualmente no SQL Editor do Supabase; ferramenta, não schema. `sql/verificar_migracao_0035.sql` — script de verificação de existência da migração 0035, também só leitura.

## Dados duplicados, isolados ou inconsistentes

1. **`processo_execucoes.situacao`** (coluna armazenada, ainda escrita por `cronograma.tsx`) vs. **`statusParcela()`** calculada (`lib/status-entrega.ts`, usada em card/Dashboard/IA) — dois conceitos paralelos de "status da parcela". Confirmar com Caio se a coluna ainda é autoritativa pra algo.
2. **`processos.dados_complementares` (jsonb)** — campo catch-all da migração `0001`; dado o quanto de coluna dedicada foi adicionada depois para tudo mais, parece resquício de pré-normalização. Não confirmado se ainda é lido/escrito por algum código atual.
3. **Três tabelas de tag paralelas** (`processo_tags`, `andamento_tags`, `tarefa_tags`) — mesmo padrão estrutural repetido 3x; não é bug, mas é repetição de boilerplate que um modelo polimórfico único evitaria (ao custo de FKs reais, o que o design atual prefere).
4. **`processo_entregas.atraso_dias`/`percentual_transcurso`** — colunas existem no schema, mas a lógica do app deliberadamente recalcula em vez de confiar nelas (`lib/entregas-derivados.ts`); podem estar efetivamente write-only pra leitura hoje — não confirmado se há leitura direta restante antes de considerá-las mortas.
5. **`nota_empenho_numero`** — texto livre em `processos`, sem tabela/estrutura de empenho própria (sem valor, data ou vínculo com parcela) — ver `GAPS.md`.
