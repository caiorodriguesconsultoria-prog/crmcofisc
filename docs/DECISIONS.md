# Registro de decisões — CRM-COFISC

> Decisões de produto/arquitetura que afetam a integração entre a branch de trabalho e `main`. Histórico de decisões anteriores do projeto, fora deste escopo, continua em `LOG.md`.

## 2026-11-27 — Liquid Glass como Design System definitivo; migração progressiva

**Aprovado por**: Caio. **Status**: finalizado — supera a decisão anterior de "CRM Premium confinado a `/design-lab` até aprovação explícita" (ver seção de decisões anteriores abaixo).

| Decisão | Status |
|---|---|
| Liquid Glass (`design-system/LIQUID_GLASS.md`) homologado como Design System definitivo do projeto | ✅ Finalizado |
| Migração visual das telas de produção acontece progressivamente, pareada a melhorias funcionais já planejadas — não de uma vez | ✅ Finalizado |
| `design-system/REGRAS.md` (bento/dashboard) passa a legado em desativação progressiva | ✅ Finalizado |

**Documentação atualizada em consequência** (sem duplicar conteúdo — só mudança de status/cabeçalho): `CLAUDE.md`, `design-system/LIQUID_GLASS.md`, `design-system/REGRAS.md`, `docs/design/DESIGN_SYSTEM.md`, `docs/audit/BRANCH_SYNC.md` (§7-10, plano de execução completo). **Nada foi implementado/migrado/publicado** — decisão de rumo registrada, execução segue pendente de autorização explícita por etapa (§7.6).

## 2026-11-27 — Integração da branch de trabalho: sidebar, unificação e preservação de `main`

**Aprovado por**: Caio.
**Contexto**: `docs/audit/BRANCH_SYNC.md` (análise de divergência entre `origin/main` e `claude/crm-cofisc-conexao-9pot1u`).

| Decisão | Status |
|---|---|
| Adotar a sidebar flutuante (ideia de `c5314dd`, "CRM Premium — Etapa 2"), já no padrão Liquid Glass (`GlassSidebar`) | ✅ Finalizado — reimplementar sobre a estrutura atual de `app/_ui/barra-topo.tsx`, não reaplicar o diff antigo (ver `BRANCH_SYNC.md` §7.3) |
| Unificar Gestores e Fiscais numa página só | ✅ Finalizado — reimplementar sobre `app/_pessoas-papel/lista.tsx` atual, preservando as 4 correções que `main` fez independentemente (ver `BRANCH_SYNC.md` §7.3) |
| Preservar toda funcionalidade/correção que `main` acumulou de forma independente (331 commits) | ✅ Mandatório — nenhuma integração pode regredir o que já está em produção |

**Por que reimplementar em vez de mesclar direto**: `origin/main` evoluiu de forma independente depois do ponto em que a branch tentou essas mudanças pela primeira vez — inclusive já havia testado e desligado uma sidebar antes (`03a23df`, "BarraTopo em todo o sistema, gaveta lateral desligada"), e corrigiu bugs reais nas páginas separadas de Fiscais/Gestores depois disso. Um merge automático do diff antigo não geraria conflito textual, mas reintroduziria uma decisão de navegação já revertida e sobrescreveria correções — por isso a decisão é **reimplementar a intenção sobre o código atual**, não reaplicar o patch.

**Plano de execução**: `docs/audit/BRANCH_SYNC.md` §7-10 (proteção de branches, base, incorporação seletiva por grupo com inventário completo de commits, backup permanente com integridade/retenção/restauração isolada, automação de testes de regressão, checkpoints e rollback por etapa, mapa de promoção de componentes, sincronização obrigatória com `main`). **Nada foi executado** — este registro e o plano são preparação, pendente de autorização explícita para a próxima etapa (execução).

## Decisões anteriores relevantes para esta integração (referência, já registradas em `LOG.md`)

- Redesenho visual da tela de login (Liquid Glass) aprovado por Caio — commit `9295702`. Pendente de confirmação de deploy (ver `docs/audit/STATUS.md`).
- ~~Trabalho do plano "CRM Premium" confinado a `/design-lab` até aprovação explícita de migração~~ — **superada** pela decisão de 2026-11-27 acima (migração progressiva agora é o processo oficial, não mais uma exceção pendente de aprovação).
