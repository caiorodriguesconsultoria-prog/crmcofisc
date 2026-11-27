# Registro de decisões — CRM-COFISC

> Decisões de produto/arquitetura que afetam a integração entre a branch de trabalho e `main`. Histórico de decisões anteriores do projeto, fora deste escopo, continua em `LOG.md`.

## 2026-11-27 — Integração da branch de trabalho: sidebar, unificação e preservação de `main`

**Aprovado por**: Caio.
**Contexto**: `docs/audit/BRANCH_SYNC.md` (análise de divergência entre `origin/main` e `claude/crm-cofisc-conexao-9pot1u`).

| Decisão | Status |
|---|---|
| Adotar a sidebar flutuante (ideia de `c5314dd`, "CRM Premium — Etapa 2") | ✅ Aprovado — reimplementar sobre a estrutura atual de `app/_ui/barra-topo.tsx`, não reaplicar o diff antigo (ver `BRANCH_SYNC.md` §7.3) |
| Unificar Gestores e Fiscais numa página só | ✅ Aprovado — reimplementar sobre `app/_pessoas-papel/lista.tsx` atual, preservando as 4 correções que `main` fez independentemente (ver `BRANCH_SYNC.md` §7.3) |
| Preservar toda funcionalidade/correção que `main` acumulou de forma independente (331 commits) | ✅ Mandatório — nenhuma integração pode regredir o que já está em produção |

**Por que reimplementar em vez de mesclar direto**: `origin/main` evoluiu de forma independente depois do ponto em que a branch tentou essas mudanças pela primeira vez — inclusive já havia testado e desligado uma sidebar antes (`03a23df`, "BarraTopo em todo o sistema, gaveta lateral desligada"), e corrigiu bugs reais nas páginas separadas de Fiscais/Gestores depois disso. Um merge automático do diff antigo não geraria conflito textual, mas reintroduziria uma decisão de navegação já revertida e sobrescreveria correções — por isso a decisão é **reimplementar a intenção sobre o código atual**, não reaplicar o patch.

**Plano de execução**: `docs/audit/BRANCH_SYNC.md` §7 (proteção de branches, base, incorporação seletiva por grupo, backup, testes de regressão, rollback). **Nada foi executado** — este registro e o plano são preparação, pendente de autorização explícita para a próxima etapa (execução).

## Decisões anteriores relevantes para esta integração (referência, já registradas em `LOG.md`)

- Redesenho visual da tela de login (Liquid Glass) aprovado por Caio — commit `9295702`. Pendente de confirmação de deploy (ver `docs/audit/STATUS.md`).
- Trabalho do plano "CRM Premium" confinado a `/design-lab` até aprovação explícita de migração — instrução original de Caio, reafirmada em cada etapa do `LOG.md`.
