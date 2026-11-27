# Lacunas, riscos e débito técnico — CRM-COFISC (AS-IS)

> Consolidado dos achados de todos os outros documentos desta auditoria. Cada item referencia onde foi detalhado.

## Funcionalidades incompletas/ausentes

| Item | Status | Onde |
|---|---|---|
| **Pagamentos** | Inexistente — placeholder literal "[Espaço reservado — módulo de pagamentos ainda não construído.]" em 3 pontos de `documento.tsx` (relatório PDF). Só existem campos de identificação (`responsavel_pagamento_nome/email`, NUP tipo pagamento), sem valor, data ou conciliação | `FEATURES.md`, `BUSINESS_RULES.md`, `DATA_MODEL.md` |
| **Nota de Empenho** | Parcial — campo de texto livre único (`nota_empenho_numero`), sem estrutura (sem valor, data, vínculo com parcela) | `DATA_MODEL.md`, `BUSINESS_RULES.md` |
| **Exportação pro Google Calendar** | Parcial — código existe (`lib/google-calendar.ts`, rotas `/api/google/*`) mas a própria UI (`app/agenda/page.tsx`) avisa "ainda não configurada (variáveis de ambiente pendentes)" em pelo menos algum ambiente | `FEATURES.md`, `INTEGRATIONS.md` |
| **Exportação para Excel** | Inexistente apesar da dependência `xlsx` estar instalada — usada só para leitura (parse de anexo pra IA), nenhuma chamada de escrita (`XLSX.write`/`writeFile`) encontrada | `FEATURES.md`, `DOCUMENTS.md` |
| **Conclusão de contrato (texto)** | Estado vazio "Conclusões ainda não definidas." equivalente ao placeholder de Pagamentos — sugere seção ainda em maturação | `FEATURES.md` |

## Risco técnico / débito

| Item | Risco | Onde |
|---|---|---|
| **Criação de contrato não é atômica** | `form.tsx`: 3 chamadas Supabase sequenciais sem transação/rollback — falha na 2ª/3ª deixa um `processos` órfão sem itens/parcelas | `BUSINESS_RULES.md`, `FEATURES.md` |
| **Duplicação intencional de regra de status** | `lib/status-entrega.ts` duplica (não importa) lógica também presente em `cronograma.tsx` por ser Client Component — o próprio código avisa que mudanças precisam ser espelhadas manualmente nos dois lugares; risco real de divergência futura | `ARCHITECTURE.md`, `BUSINESS_RULES.md` |
| **Dois conceitos de "status de parcela"** | Coluna armazenada `processo_execucoes.situacao` (ainda escrita por `cronograma.tsx`) convive com a função calculada `statusParcela()` (lida em toda parte) — não confirmado se a coluna ainda é autoritativa pra algo | `ARCHITECTURE.md`, `DATA_MODEL.md` |
| **Zero testes automatizados** | Nenhum `*.test.ts(x)`, nenhum Jest/Vitest/Playwright no projeto; maior risco de regressão silenciosa em lógica de negócio densa (`cronograma.tsx` ~1500 linhas, `status-entrega.ts`) | `TESTS.md` |
| **Sem CI de verificação** | Nenhum workflow roda `tsc`/`build`/lint automaticamente — disciplina de verificação pré-commit é só manual | `TESTS.md` |
| **`.env.example` incompleto** | Não lista `ANTHROPIC_API_KEY`, `CRON_SECRET`, chaves VAPID, `AGENDA_ICS_TOKEN` — risco de onboarding, não de segurança | `ARCHITECTURE.md` |
| **Modelo de IA inconsistente entre rotas** | `claude-haiku-4-5-20251001` (extração, reformulação) vs. `claude-opus-5-5` (assistente) — uma geração de diferença, não quebrado mas vale revisão | `AI.md` |
| **Sem validação de schema na saída da IA** | Extrações de PDF/pauta/entregas fazem `JSON.parse` bruto sem validação (zod/ajv) antes de preencher o formulário — um JSON válido mas malformado passaria direto | `AI.md` |

## Dados duplicados, isolados ou inconsistentes

| Item | Onde |
|---|---|
| `processos.dados_complementares` (jsonb catch-all da migração `0001`) — possível resquício de pré-normalização, não confirmado se ainda lido | `DATA_MODEL.md` |
| Três tabelas de tag estruturalmente idênticas (`processo_tags`, `andamento_tags`, `tarefa_tags`) — repetição de padrão, não bug | `DATA_MODEL.md` |
| `processo_entregas.atraso_dias`/`percentual_transcurso` — colunas existem mas o app recalcula ao vivo; não confirmado se há leitura direta restante | `DATA_MODEL.md` |
| Ocorrências não é tabela própria — é uma *view* lógica sobre `andamentos` (`tipo="Ocorrência"` + `incluirRelatorio`) | `FEATURES.md`, `DATA_MODEL.md` |

## Divergência entre branch de trabalho e produção (achado desta auditoria, não do código em si)

Ver `STATUS.md` para o detalhe completo. Resumo: a branch de trabalho (`claude/crm-cofisc-conexao-9pot1u`) tem commits reais de produto (unificação de Gestores/Fiscais, `execucaoFisica`, `lib/relatorio-status.ts`, extração de `barra-lateral.tsx`, redesenho do login) que **não estão no deploy de produção atual** (confirmado via Vercel, commit `0efae14`). Isso significa:

1. **A documentação anterior desta sessão (`design-lab/CONHECIMENTO.md`, `docs/design/COMPONENTS.md`) descreve `app/_ui/barra-lateral.tsx` como "produção"** — mas esse arquivo não existe em `origin/main`. Produção usa uma barra superior (`barra-topo.tsx`), não sidebar. Recomenda-se corrigir essa referência numa próxima atualização de `docs/design/` (fora do escopo desta auditoria, que é só leitura).
2. **O redesenho da tela de login (Liquid Glass) não está confirmado em produção** — existe só na branch de trabalho. Recomenda-se confirmar com Caio se houve algum merge/deploy fora do fluxo git observado aqui, antes de tratar essa afirmação como fato.

## Recomendações de verificação com Caio (não decisões — só apontamentos)

- Confirmar se `processo_execucoes.situacao` ainda tem uso real ou pode ser descontinuada em favor do cálculo.
- Confirmar se `processos.dados_complementares` ainda é lido por algum fluxo.
- Decidir se "Pagamentos" entra no roadmap antes ou depois de "Nota de Empenho" estruturada.
- Confirmar se a tela de login redesenhada (Liquid Glass) está de fato publicada, e se não, planejar o merge.
