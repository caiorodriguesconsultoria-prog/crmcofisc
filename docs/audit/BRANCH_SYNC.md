# Divergência `origin/main` × branch de trabalho — análise (sem merge/rebase/reset)

> Só análise. Nenhum comando de integração foi executado. Atualiza o achado já registrado em `STATUS.md`/`GAPS.md` com a causa raiz e um plano de integração seguro.

## 1. HEADs, ancestral comum e deploy

| Ref | Commit | Data |
|---|---|---|
| `origin/main` (produção) | `0efae14` | 2026-11-23 19:16:25 |
| `claude/crm-cofisc-conexao-9pot1u` (branch de trabalho) | `f33041d` | 2026-11-27 19:09:16 |
| Ancestral comum (`git merge-base`) | `d1bac7f` ("Contratos: menos vão no topo...") | 2026-11-23 19:16:17 |
| Deploy Vercel de produção (confirmado via MCP) | `0efae14`, branch `main` do GitHub | mesmo commit do `origin/main` acima |

`git rev-list --left-right --count origin/main...claude/crm-cofisc-conexao-9pot1u` → **331** commits só em `main`, **39** só na branch (contando o commit da auditoria anterior).

**Causa raiz da divergência**: esta branch é um nome reutilizado ao longo de todo o histórico do projeto como "branch de trabalho do Claude" — não uma feature branch de vida curta. O próprio histórico de `main` mostra **56 merges** vindos dela (`"Merge branch 'claude/crm-cofisc-conexao-9pot1u' into _merge-to-main"` e `"Merge claude/crm-cofisc-conexao-9pot1u: ..."`), em pontos espalhados por meses. A última vez que essa branch foi reiniciada/sincronizada foi exatamente no ancestral comum (`d1bac7f`, 2026-11-23). Depois disso, **esta sessão continuou commitando na branch sem reiniciá-la a partir do `main` atualizado** (passo que a convenção do projeto pede após um merge: reiniciar a branch do mesmo nome a partir do HEAD de `main`) — daí os 331 commits que `main` acumulou em paralelo, por outras sessões/fluxos, sem nunca voltar pra esta branch.

## 2. Classificação dos commits exclusivos

### Só na branch (39) — enumerados

| Categoria | Commits | Resumo |
|---|---|---|
| **Produto (telas reais, fora do `/design-lab`)** | `1ca1710`, `e38c436`, `a1c6f28`, `5e76a77`, `a1fe8a5`, `c5314dd`, `1fde21a`, `332d3bd`, `1c18e64`, `0b85575`, `f75a8ee`, `4d984ac`, `9295702` | Anel de execução física em Contratos; 3 commits de performance (debounce de busca, memoização do Painel, streaming/cancelamento do Assistente); **"CRM Premium" Etapas 1-5**: tokens/componentes Liquid Glass, **sidebar flutuante no desktop + unificação de Gestores/Fiscais**, indicadores novos do Painel, "Concluídos" dentro de Contratos, controle segmentado animado na tela do contrato, vidro calibrado na janela do contrato; redesenho Liquid Glass da tela de login |
| **Design (protótipo `/design-lab`, isolado)** | `4926de0`, `48517ad`, `f86c086`, `5876c5e`, `7112782`, `438cb52`, `76b56a2`, `0b6df21`, `e65e9d3`, `4d9badb`, `f0c07b6`, `ae7f011`, `d27dfb9`, `43c4ec3`, `b2a787f`, `396db96`, `c7f80cb`, `537b95e`, `c9067a6`, `8a6a524`, `0faa598`, `a925bcb` | As 10 etapas do plano "CRM Premium" no `/design-lab` + homologação final (tablet, focus trap, sparkline SVG) — documentado em `docs/design/` |
| **Documentação** | `1cdcfab`, `6f62de0`, `2aa7038`, `f33041d` | `docs/design/*`, `CRM_DESIGN.zip`, `docs/audit/*` (auditoria AS-IS anterior), `CRM_AUDIT.zip` |
| **Correções** | nenhum commit isolado nesta branch está rotulado como correção pura — as 3 de performance acima (`e38c436`, `a1c6f28`, `5e76a77`) são o item mais próximo, mas são melhoria, não bugfix |

### Só em `main` (331) — caracterizados por amostragem temática (não enumerados individualmente — fora do escopo de saída mínima)

| Categoria (por palavra-chave no commit) | Contagem aproximada | Nota |
|---|---|---|
| Merges (desta mesma branch, em pontos anteriores) | 56 | Confirma que esta branch já foi integrada a `main` repetidas vezes antes do ponto de ancestral comum |
| "Add files via upload" | 20 | Commits de carregamento inicial do projeto (via interface web do GitHub), não revisáveis como feature |
| Relacionados a IA (Claude/OpenAI/Haiku) | ~49 | Iteração do provedor/modelo de IA do Andamento — inclusive **trocas de provedor** (Claude→OpenAI→Claude Haiku 4.5), não refletidas na branch |
| Relacionados a Google/integrações/backup/push | ~21 | Sincronização de tarefas como Google Tasks (não mais evento), troca de autenticação do backup pro Drive, exigência de admin no callback OAuth |
| Design/UI (ícone, pílula, unificação de cards, sidebar desligada) | ~46 | Inclui **"BarraTopo em todo o sistema (gaveta lateral desligada)"** — ver seção 3 |
| Correção explícita (`fix`) | 7 | Ex.: overflow de tabela no Cronograma, navegação lenta na barra lateral |
| Performance (`perf`) | 5 | Região de função Vercel, menos idas ao banco no Painel, loading instantâneo |
| Segurança | 4 | Exige admin logado no callback OAuth do Google, entre outras |

## 3. Conflitos, regressões e funcionalidades ausentes

**Conflito textual**: `git merge-tree --write-tree origin/main claude/crm-cofisc-conexao-9pot1u` roda limpo (retorna só o SHA da árvore resultante, sem marcador de `CONFLICT`) — um merge automático hoje **não pararia por conflito de texto**.

**Risco semântico real, apesar de não haver conflito textual** — achado principal desta análise:

> O commit `c5314dd` ("CRM Premium — Etapa 2: sidebar flutuante no desktop + Gestores/Fiscais unificado", 2026-11-24, só na branch) reintroduz uma **sidebar lateral** e **unifica Gestores/Fiscais numa página só**. Só que `main`, de forma totalmente independente e **depois** do ponto em que essa ideia já tinha sido tentada antes neste projeto, tem o commit `03a23df` ("Merge: BarraTopo em todo o sistema (gaveta lateral desligada) + espaçamento do Painel") — ou seja, **a gaveta lateral já foi testada e deliberadamente desligada em produção antes**, e a navegação real hoje é a barra superior de cápsulas (`app/_ui/barra-topo.tsx`, sem FK pra Fiscais/Gestores separados). Um merge ingênuo da branch sobre o `main` atual **reintroduziria uma sidebar que já foi removida de propósito**, e poderia **desfazer correções reais que `main` aplicou nas telas separadas de Fiscais/Gestores depois do ponto de divergência** (`55acc9a` corrige botão de copiar sumido; `373cc51` adiciona tag de ausência; `d80b5a7` corrige rolagem horizontal no mobile; `67ca2e3` corrige cadastro quando a pessoa já existe) — todas feitas na estrutura de páginas separadas que a branch está prestes a substituir.

**Funcionalidades ausentes na branch** (presentes só em `main`, nunca trazidas de volta):
- Tarefas sincronizando como Google Tasks em vez de evento do Google Calendar (mudança de modelo de integração).
- Modelo de IA do Andamento passou por Claude→OpenAI→Claude Haiku 4.5 em `main`; a branch nunca recebeu nenhuma dessas trocas — hoje a branch e o `main` podem estar chamando provedores/modelos diferentes para a mesma funcionalidade (`app/api/ai/reformular-andamento`).
- Exigência de admin logado no callback OAuth do Google (reforço de segurança feito só em `main`).
- Pelo menos 4 correções de bug em Fiscais/Gestores/Cronograma/mobile feitas só em `main` (listadas acima).

**Funcionalidades presentes só na branch, ausentes em `main`** (resumo — detalhe completo em `docs/design/` e `docs/audit/`):
- Protótipo Liquid Glass completo (`/design-lab`, 10 etapas + homologação).
- Redesenho da tela de login (Liquid Glass).
- Extração de `app/_ui/barra-lateral.tsx` + `controle-segmentado.tsx` como componentes.
- `lib/relatorio-status.ts` (regra de relatório desatualizado centralizada) e `execucaoFisica` em `lib/status-entrega.ts`.
- 3 commits de performance (debounce de busca, memoização do Painel, streaming/cancelamento do Assistente).

## 4. Backups e cobertura dos arquivos anexados

`.github/workflows/backup-diario.yml` é **idêntico** em `main` e na branch (sem divergência) — o achado abaixo vale para os dois lados igualmente, não é causado pela divergência:

- O backup diário faz `pg_dump` **só do banco Postgres** (linhas/metadados). **Não cobre o Supabase Storage** — os anexos de verdade enviados via `app/processos/[id]/andamentos.tsx` (`supabase.storage.from("andamento-anexos").upload(...)`) ficam de fora do backup inteiramente.
- Consequência: a tabela `andamento_anexos` (metadado: nome, caminho) está no dump, mas se o bucket `andamento-anexos` for perdido/corrompido, o dump restaurado teria registros apontando para arquivos que não existem mais.
- Recomendação (só apontamento, fora do escopo de execução): avaliar com Caio se o bucket de Storage precisa entrar na rotina de backup (ex.: `supabase storage download` ou replicação do bucket), já que hoje só o `pg_dump` roda.

## 5. Proposta de integração segura (preservando as duas versões) — análise, não execução

Dado o achado da seção 3, **não recomendamos um `git merge` direto** apesar de não haver conflito textual — o risco é semântico (reintroduzir a sidebar desligada, sobrescrever correções de Fiscais/Gestores). Caminho sugerido, em etapas, para quando Caio aprovar:

1. **Separar os 39 commits da branch em dois grupos antes de qualquer ação de git**: (a) os de produto que tocam telas reais fora do `/design-lab` (Etapas 1-5 do CRM Premium, incluindo a sidebar/unificação) e (b) tudo mais (design-lab, documentação, performance, login).
2. **Grupo (b) primeiro** — é de baixo risco: nenhum desses arquivos foi tocado por `main` depois do ancestral comum (confirmado por arquivo nesta análise, exceto o próprio `app/login/page.tsx`, que também não mudou em `main`). Pode seguir o fluxo padrão do projeto (reiniciar a branch a partir do `main` atual, reaplicar/rebasear só esses commits, abrir PR) sem perda.
3. **Grupo (a) — decisão de produto antes de qualquer git**: perguntar a Caio se a sidebar flutuante e a unificação de Gestores/Fiscais da Etapa 2 ainda são a direção desejada, já que `main` evoluiu na direção oposta (barra superior, páginas separadas) depois que essa ideia já tinha sido tentada antes. Se a resposta for "não, manter como está em produção": descartar/não reaplicar esses commits específicos (ou adaptá-los manualmente escolhendo o que fazia sentido, campo a campo, não um merge automático). Se a resposta for "sim, aplicar": portar a intenção manualmente sobre a estrutura atual de `main` (duas páginas, barra superior), não reaplicar o diff antigo, exatamente para não perder as 4 correções de bug que `main` fez nas páginas separadas nesse meio-tempo.
4. **Rollback, nos dois casos**: como nada é mesclado direto em `main`, o rollback natural é simplesmente **não abrir/fechar o PR sem merge** — nenhuma ação em `main` acontece até aprovação explícita. Depois de um eventual merge futuro, o padrão do projeto de registrar o commit do merge em `main` (ex. `0efae14`) continua servindo como ponto de rollback via `git revert` desse commit específico, sem afetar dado/sessão (confirmado em `docs/design/MIGRATION.md` para o caso do login).
5. **Depois da integração** (quando ela ocorrer, fora desta análise): reiniciar a branch `claude/crm-cofisc-conexao-9pot1u` a partir do novo HEAD de `main`, conforme a convenção já estabelecida do projeto, para não repetir esta mesma divergência.

## 6. Correção de referências documentais incorretas sobre produção

Com base na confirmação desta análise (produção = `main`, sem sidebar, sem o redesenho de login, sem a unificação de Gestores/Fiscais), as seguintes referências foram corrigidas nos documentos onde apareciam (edição de documentação apenas — nenhum código de produto foi tocado):

- `CLAUDE.md` — trecho "hoje: tela de login em produção" ajustado para refletir que o redesenho ainda não está confirmado no deploy.
- `design-system/LIQUID_GLASS.md` — seção "Status de produção" ajustada com a mesma ressalva.
- `app/design-lab/CONHECIMENTO.md` — nota de status de produção ajustada.
- `docs/design/COMPONENTS.md`, `docs/design/MIGRATION.md` — todas as menções a `app/_ui/barra-lateral.tsx` como "produção" corrigidas para "só na branch de trabalho, produção usa `barra-topo.tsx`".
- `docs/design/STATUS.md` — "✅ Tela de login — única peça deste plano em produção hoje" corrigida.
- `docs/audit/FEATURES.md` — seção "Gestores e Fiscais" corrigida: a unificação é só na branch; produção mantém as páginas separadas.

Essas são as mesmas referências já sinalizadas como pendência em `docs/audit/GAPS.md`/`STATUS.md`/`UI_UX.md` — a diferença é que agora o texto-fonte nos documentos originais foi efetivamente ajustado, não só apontado.
