# Regras de negócio — CRM-COFISC (AS-IS)

> Cálculos, prazos, validações e exceções, com referência de arquivo/função. Ver `DATA_MODEL.md` para as tabelas envolvidas e `FEATURES.md` para a tela que usa cada regra.

## Status de entrega por parcela

`lib/status-entrega.ts::statusParcela()` — ordem de prioridade:
1. Avaria/desvio pendente ⇒ **amarelo**, independente de datas.
2. Entregue (`totalLancado ≥ quantidade`) com `data_entrega` ⇒ **vermelho** se entregue depois de `data_prevista`, senão **verde**.
3. Não entregue e já passou de `data_prevista` ⇒ **vermelho**.
4. Não entregue, vencendo em até `DIAS_ANTECEDENCIA_AMARELO = 5` dias ⇒ **amarelo**.
5. Caso contrário ⇒ **neutro**.

**Avaria/desvio pendente sobrepõe uma entrega no prazo** — decisão deliberada de produto, documentada em comentário no código, não descuido.

## Status do contrato

`statusContrato` (mesmo arquivo) = conjunto dos status distintos (não-neutros) entre as parcelas do contrato — renderizado como cor sólida (1 status) ou gradiente vermelho→amarelo→verde da esquerda pra direita (vários), via `gradienteOuSolido`.

## Execução física

`execucaoFisica`: Σ entregue (lançamentos excluindo tipo `avaria`/`desvio`) ÷ Σ contratado, somado por todas as parcelas do contrato — alimenta o anel mostrado no card da lista. Só calculado quando o contrato tem ao menos 1 parcela.

## Relatório desatualizado

`lib/relatorio-status.ts`: `true` se `relatorio_atualizado_em` for nulo, ou se já passaram mais de `LIMITE_DIAS_RELATORIO = 10` dias desde a última marcação. Regra centralizada (comentário no arquivo nota que já esteve duplicada em dois lugares); reusada em `app/processos/page.tsx`, no assistente de IA (`app/api/assistente/route.ts`) e no Dashboard.

## Transcurso de validade

`lib/entregas-derivados.ts::calcularTranscurso`: `(dias(entrega−fabricação)) / (dias(validade−fabricação)) × 100`; `null` se qualquer uma das três datas faltar ou o denominador for 0. Fórmula confirmada com o dono do produto, conforme comentário no código.

## Atraso/faltante por UF

`calcularDerivadosEntregas` (mesmo arquivo): entregas são casadas com linhas da Pauta **por UF, em ordem de data, primeira-linha-não-usada-para-primeira-linha-não-usada** (não por vínculo explícito) — ou seja, a N-ésima entrega pra uma UF é comparada com a N-ésima linha de pauta ainda não usada daquela UF. Atraso é `max(0, dias(entrega − previsto))` (nunca negativo — entrega no prazo ou adiantada mostra 0, mesma convenção do Cronograma). Faltante é `Σpauta(UF) − Σentregue(UF)` acumulado entre todas as entregas daquela UF, não só até a linha atual.

## Cobertura de férias

Ad hoc em `lista.tsx::corDeFundoLinha`, `cobertura.tsx`, `novo/form.tsx`: um contrato está "em cobertura" sse `titular_id` e `responsavel_atual_id` estão ambos definidos e diferem. Criar/ativar cobertura **exige** `motivoBackup` (texto livre) — validado no cliente (`form.tsx`: "Informe quem assume e o motivo da cobertura."). Tingimento do card na lista: verde se quem vê é quem está cobrindo, âmbar se é outra pessoa — nunca colorido fora de cobertura ("senão a maioria dos contratos ficaria destacada à toa", comentário no código).

## Ausência de pessoa

`lib/ausencia.ts::estaAusente`: hoje ≥ `ausencia_inicio` (obrigatório) E (`ausencia_fim` nulo OU hoje ≤ `ausencia_fim`) — ou seja, ausência em aberto se não houver data de fim.

## Checagem de pessoa duplicada

`lib/verificar-pessoa-duplicada.ts`: antes de criar gestor/fiscal/responsável inline, roda uma busca `ilike` por nome ou exata por matrícula; se encontrada, **a criação é pulada e o papel é estendido na pessoa existente** (`garantirPessoaComPapel` insere só em `pessoa_papeis`, reaproveitando a linha de `pessoas`) — existe especificamente porque `matricula` tem constraint de unicidade no banco, que rejeitaria o insert e falharia silenciosamente em mostrar a pessoa sob o novo papel.

## Resolução de avaria/desvio

`cronograma.tsx`, espelhado em `status-entrega.ts::temAvariaOuDesvioPendente`: um lançamento com `quantidade_avaria > 0` e/ou `quantidade_desvio > 0` fica "pendente" até existir um lançamento **filho** (`lancamento_pai_id` apontando de volta) do tipo correspondente (`avaria`/`desvio`) — ou seja, a resolução é ela mesma um novo lançamento no ledger, não uma troca de status na linha original. Avaria e desvio precisam se resolver independentemente antes do pai ser considerado limpo.

## Criação de contrato não é atômica

`form.tsx` (linhas ~270-346): três chamadas Supabase sequenciais (`processos` → `processo_itens` → opcional `processo_execucoes`) com checagem manual de erro entre cada uma, **sem transação/rollback** — se a 2ª ou 3ª falhar, a linha de `processos` da 1ª persiste órfã (sem itens/parcelas). Ver `GAPS.md`.

## Regra de item padrão

Todo contrato precisa de ≥1 linha em `processo_itens`; se os campos de item ficarem vazios no formulário, o sistema cria automaticamente um item cuja `descricao` é copiada do campo `objeto` do contrato (`form.tsx`) — mesmo padrão usado pela migração histórica que converteu contratos pré-existentes pro modelo multi-item.

## Pagamentos — sem regra de negócio a documentar

O gerador de PDF (`documento.tsx`) reserva literalmente o espaço com uma string-placeholder em três pontos; não existe entidade de pagamento, validação ou cálculo. Qualquer pergunta sobre "pagamento" se refere só aos campos `responsavel_pagamento_nome/email` em `processos` e ao NUP com `tipo="pagamento"` em Cronograma — ambos são dado de referência/identificação, não controle financeiro.

## Duplicação intencional, fora de escopo de correção

`lib/status-entrega.ts` (comentário nas primeiras linhas) avisa que sua lógica de data/quantidade é **intencionalmente duplicada** (não importada) em `cronograma.tsx`, porque este é um Client Component e aquele também precisa rodar no servidor — "qualquer mudança nessa lógica deve ser espelhada nos dois lugares". Risco de divergência real, documentado pelo próprio código — ver `GAPS.md`.
