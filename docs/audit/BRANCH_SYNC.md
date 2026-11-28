# Divergência `origin/main` × branch de trabalho — análise e preparação (sem merge/rebase/reset)

> Só análise/preparação. Nenhum comando de integração foi executado. **Decisões aprovadas e finalizadas** (ver `docs/DECISIONS.md`): Liquid Glass é o Design System definitivo; migração visual progressiva junto às melhorias funcionais; sidebar flutuante e Gestores/Fiscais unificados; preservação integral do que já existe em `main`. **Seção 2** traz o inventário completo de commits exclusivos classificados; **Seção 7** traz o plano de execução (backup permanente, checkpoints, rollback, automação de regressão).

## 1. HEADs, ancestral comum e deploy

| Ref | Commit | Data |
|---|---|---|
| `origin/main` (produção) | `0efae14` | 2026-11-23 19:16:25 — reconfirmado via Vercel nesta rodada, sem mudança desde a análise anterior |
| `claude/crm-cofisc-conexao-9pot1u` (branch de trabalho) | `40bcb9c` | 2026-11-27 19:48:02 |
| Ancestral comum (`git merge-base`) | `d1bac7f` ("Contratos: menos vão no topo...") | 2026-11-23 19:16:17 — inalterado |
| Deploy Vercel de produção (confirmado via MCP) | `0efae14`, branch `main` do GitHub | mesmo commit do `origin/main` acima — inalterado |

`git rev-list --left-right --count origin/main...claude/crm-cofisc-conexao-9pot1u` → **331** commits só em `main`, **41** só na branch (cresceu de 39 para 41 com os 2 commits de documentação desta e da rodada anterior — nenhum deles muda o inventário abaixo além de se somar a ele).

**Causa raiz da divergência**: esta branch é um nome reutilizado ao longo de todo o histórico do projeto como "branch de trabalho do Claude" — não uma feature branch de vida curta. O próprio histórico de `main` mostra **56 merges** vindos dela (`"Merge branch 'claude/crm-cofisc-conexao-9pot1u' into _merge-to-main"` e `"Merge claude/crm-cofisc-conexao-9pot1u: ..."`), em pontos espalhados por meses. A última vez que essa branch foi reiniciada/sincronizada foi exatamente no ancestral comum (`d1bac7f`, 2026-11-23). Depois disso, **esta sessão continuou commitando na branch sem reiniciá-la a partir do `main` atualizado** (passo que a convenção do projeto pede após um merge: reiniciar a branch do mesmo nome a partir do HEAD de `main`) — daí os 331 commits que `main` acumulou em paralelo, por outras sessões/fluxos, sem nunca voltar pra esta branch.

## 2. Classificação dos commits exclusivos

### Só na branch (41) — inventário completo, por commit

Classificação: **incorporar** (levar como está ou quase, baixo risco) · **adaptar** (reimplementar a intenção sobre o estado atual de `main`, não reaplicar o diff) · **adiar** (depende de decisão/trabalho adicional antes de poder agir) · **descartar** (superado por trabalho posterior na própria branch, não precisa de ação). Todas as classificações abaixo são **propostas, mediante aprovação de Caio por grupo** antes da execução (nenhuma foi executada).

| Commit | Categoria | Classificação | Por quê |
|---|---|---|---|
| `1ca1710` Anel de execução física em Contratos | Produto | **Adaptar** | `lib/status-entrega.ts` e `app/processos/lista.tsx` mudaram muito em `main` desde então — reimplementar a função sobre o código atual |
| `a1c6f28` Performance: debounce na busca de Contratos | Correção/performance | **Adaptar** | `app/processos/lista.tsx` reescrito várias vezes em `main` — reaplicar a técnica, não o patch |
| `e38c436` Performance: memoiza listas do Dashboard | Correção/performance | **Adaptar** | `app/dashboard/painel-dashboard.tsx` idem |
| `5e76a77` Performance: streaming+cancelamento no Assistente | Correção/performance | **Adaptar** | `app/api/assistente/route.ts`/`chat.tsx` evoluíram bastante em `main` (inclusive troca de provedor de IA, ver `ARCHITECTURE.md`) |
| `a1fe8a5` CRM Premium Etapa 1: tokens/componentes Liquid Glass (direto em produção) | Design | **Descartar** | Superado pela versão refinada e homologada no `/design-lab` (tokens/componentes abaixo) — não reaplicar esta versão inicial |
| `c5314dd` Sidebar flutuante + Gestores/Fiscais unificado | Produto (decisão aprovada) | **Adaptar** | Ver §7.3 — reconstituir sobre `barra-topo.tsx`/`app/_pessoas-papel/lista.tsx` atuais, preservando as 4 correções que `main` fez nesse meio-tempo |
| `1fde21a` Indicadores novos do Painel | Produto | **Adaptar** | Conferir sobreposição com os KPIs que o Dashboard de `main` já tem hoje antes de aplicar |
| `332d3bd` KPI "Tarefas pendentes" | Produto | **Incorporar** | Confirmado nesta rodada: `main` não tem esse KPI — adição aditiva, sem conflito |
| `1c18e64` "Concluídos" dentro de Contratos (aba, não página separada) | Produto | **Adaptar** | `main` ainda tem `/processos/concluidos` como página completa própria (85 linhas, não um stub) — decidir com Caio se a reorganização em aba ainda é desejada antes de aplicar |
| `0b85575` Controle segmentado animado na tela do contrato | Produto | **Adaptar** | `main` usa botões de aba escritos à mão em `abas.tsx` hoje — trocar por `ControleSegmentado` é compatível com a decisão de migração visual, mas precisa ser refeito sobre o arquivo atual |
| `f75a8ee`, `4d984ac` Vidro calibrado/intenso na janela do contrato (tentativa antiga) | Design | **Descartar** | Superado pela calibração final do `/design-lab` (`vidroNivel`, ver `DESIGN_SYSTEM.md`) — usar essa versão na migração, não a antiga |
| `a925bcb` Isolamento do laboratório Liquid Glass | Design/processo | **Incorporar** (parcialmente superado) | O artefato (`/design-lab` como banco de componentes validados) continua sendo a fonte dos componentes a promover; a *política* de "só no laboratório, nunca em produção" que este commit estabeleceu foi substituída pela decisão atual de migração progressiva |
| `4926de0` … `f0c07b6` (17 commits: refração, opacidade, timeline/abas do design-lab, Motion Design, acessibilidade, regressão, auditoria de dependências, teste e reversão do shader) | Design | **Incorporar** | Componentes/tokens homologados — ver §8 (mapa de promoção) para o que vai para `app/_ui/` e o que fica só como ferramenta de laboratório (ex. `shader-teste`) |
| `9295702` Login redesenhado (Liquid Glass) | Produto (já aprovado visualmente) | **Incorporar** | Primeira tela já migrada — só falta confirmar segurança/auth não divergiu em `main` (§7.2, grupo 2) antes de publicar |
| `ae7f011` Consolidação do Design System Liquid Glass | Documentação/Design | **Incorporar** | `design-system/LIQUID_GLASS.md` — agora promovido a definitivo (ver §9) |
| `d27dfb9` Esferas 3D no fundo ambiental | Design | **Incorporar** | Parte do sistema homologado |
| `43c4ec3` Sparklines (versão `recharts`, passo 4) | Design | **Descartar** | Superada pela versão SVG do passo de homologação (`0faa598`) — usar essa |
| `b2a787f` … `8a6a524` (passos 5-10 do `/design-lab`) | Design | **Incorporar** | Hover de cards, filtros, menu de conta, Andamentos/Relatório modernizados, sheet mobile, assistente de IA flutuante, microinterações, auditoria final — tudo homologado |
| `1cdcfab`, `6f62de0` Documentação das 10 etapas + `CRM_DESIGN.zip` | Documentação | **Incorporar** | Cópia direta, sem conflito |
| `0faa598` Homologação final (tablet, focus trap, sparkline SVG) | Design | **Incorporar** | Correções já validadas em 3 motores (Chromium/Firefox/WebKit) |
| `2aa7038` Documentação da homologação | Documentação | **Incorporar** | Cópia direta |
| `f33041d` Auditoria AS-IS (`docs/audit/`) | Documentação | **Incorporar** | Cópia direta |
| `c4eb9f6` `BRANCH_SYNC.md` v1 + correções de referência | Documentação | **Incorporar** | Cópia direta (este arquivo evolui nesta própria rodada) |
| `40bcb9c` Plano de integração v1 + `DECISIONS.md` | Documentação | **Incorporar** | Cópia direta |

Nenhum commit desta branch foi classificado como **correção pura** isolada — as 3 de performance (`a1c6f28`, `e38c436`, `5e76a77`) são o item mais próximo, mas são melhoria, não bugfix, e todas exigem reimplementação (ver tabela).

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

**Classificação única para os 331**: **preservar** — já estão em produção, nenhuma ação de "incorporar/adaptar/adiar/descartar" se aplica a eles (essas categorias descrevem o que fazer com o que falta trazer da branch, não o que já está vivo). O único cuidado é não perder nenhum deles ao reimplementar os itens da branch marcados **adaptar** acima — ver §7.3 para os pontos de maior sobreposição (Fiscais/Gestores, BarraTopo, status de entrega).

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

## 5. Proposta de integração segura — histórico (superada pelo plano finalizado)

> Esta seção registrava a proposta condicional de uma rodada anterior, quando "sidebar flutuante" e "unificação" ainda dependiam de uma pergunta em aberto pra Caio. Essa pergunta já foi respondida (decisões finalizadas em `docs/DECISIONS.md`) — **o plano vigente é a seção 7-10**, não este aqui. Mantido só como registro histórico do raciocínio, não como instrução ativa.

## 6. Correção de referências documentais incorretas sobre produção

Com base na confirmação desta análise (produção = `main`, sem sidebar, sem o redesenho de login, sem a unificação de Gestores/Fiscais), as seguintes referências foram corrigidas nos documentos onde apareciam (edição de documentação apenas — nenhum código de produto foi tocado):

- `CLAUDE.md` — trecho "hoje: tela de login em produção" ajustado para refletir que o redesenho ainda não está confirmado no deploy.
- `design-system/LIQUID_GLASS.md` — seção "Status de produção" ajustada com a mesma ressalva.
- `app/design-lab/CONHECIMENTO.md` — nota de status de produção ajustada.
- `docs/design/COMPONENTS.md`, `docs/design/MIGRATION.md` — todas as menções a `app/_ui/barra-lateral.tsx` como "produção" corrigidas para "só na branch de trabalho, produção usa `barra-topo.tsx`".
- `docs/design/STATUS.md` — "✅ Tela de login — única peça deste plano em produção hoje" corrigida.
- `docs/audit/FEATURES.md` — seção "Gestores e Fiscais" corrigida: a unificação é só na branch; produção mantém as páginas separadas.

Essas são as mesmas referências já sinalizadas como pendência em `docs/audit/GAPS.md`/`STATUS.md`/`UI_UX.md` — a diferença é que agora o texto-fonte nos documentos originais foi efetivamente ajustado, não só apontado.

## 7. Plano de integração aprovado e finalizado (preparação — não executado)

Decisões finais de Caio (registradas em `docs/DECISIONS.md`): **Liquid Glass é o Design System definitivo do projeto**; a migração das telas de produção acontece **progressivamente, junto com melhorias funcionais já planejadas** (não de uma vez); adotar a sidebar flutuante e unificar Gestores/Fiscais, nos dois casos **já no padrão Liquid Glass**; preservar toda funcionalidade/correção que `main` acumulou de forma independente. O plano abaixo é a preparação para quando a execução for autorizada — nenhum passo aqui foi rodado.

### 7.0 Proteção das branches (Fase 00.1 — executada em 2026-11-28, ver §11)

Checkpoint de proteção, por SHA exato (não por tag — a tentativa de criar tags `safety/*` em `origin` foi negada pelo GitHub, HTTP 403; este git local está autorizado a dar push só na branch de trabalho nomeada, não em novos refs — ver §11 pro impedimento completo):

- **Produção/`origin/main`**: `0efae14e81402af9336b48f8969e73a9a61f1a8a` — reconfirmado via Vercel nesta data, sem mudança desde a análise anterior.
- **Branch de trabalho**: `101c9f528220d90cb0a0a90ec49c6d27b989fafc` — HEAD no momento desta checagem (2026-11-28 00:35 UTC).

Esses dois SHAs são o checkpoint de rollback oficial até que Caio crie as tags de verdade (comando pronto em §11) ou autorize outro mecanismo de proteção.

### 7.1 Base da integração

Toda incorporação parte de **`origin/main` no commit atual (`0efae14`)** — não do ancestral comum antigo (`d1bac7f`) nem do estado atual da branch de trabalho. Isso garante que nenhuma das 331 mudanças exclusivas de `main` seja perdida.

### 7.2 Incorporação seletiva por grupo (adaptada à estrutura atual, não diff literal)

| Grupo | Conteúdo | Risco | Sistema visual | Método |
|---|---|---|---|---|
| **1. Design (fundação)** | `/design-lab` inteiro, `docs/design/`, `docs/audit/`, `design-system/LIQUID_GLASS.md`, `CRM_DESIGN.zip`/`CRM_AUDIT.zip` | Baixo | — (é a fonte, não uma tela) | Cópia direta sobre `main` atual — nenhum desses arquivos foi tocado por `main` desde o ancestral comum; são arquivos novos, sem diff a reconciliar |
| **2. Login** | `app/login/page.tsx`, `app/login/_fundo.tsx`, `app/login/CONHECIMENTO.md` | Médio | Liquid Glass (já aplicado) | Adoção quase direta — `app/login/page.tsx` não foi tocado por `main` desde o ancestral comum. **Antes de sobrescrever**, reconferir se `main` fez correção de segurança em `lib/supabase/*`/`middleware.ts` que precise refletir no fluxo exibido |
| **3. Melhorias de performance + migração visual pareada** | `e38c436` (Painel), `a1c6f28` (Contratos), `5e76a77` (Assistente) | Médio | Liquid Glass, aplicado **junto** com a melhoria (decisão: migração progressiva pareada a melhorias funcionais) | **Não reaplicar como patch.** Reimplementar a melhoria de performance sobre o código atual de `app/dashboard/painel-dashboard.tsx`, `app/processos/lista.tsx`, `app/assistente/chat.tsx`/`app/api/assistente/route.ts` — e, no mesmo commit/PR, migrar os componentes visuais tocados por essa mudança para os equivalentes do `/design-lab` (`GlassCard`, `GlassSparklineSVG`, etc. — ver §8), em vez de migrar a tela inteira de uma vez |
| **4. Sidebar flutuante + unificação Gestores/Fiscais** | Decisão aprovada, maior risco — ver 7.3 | Alto | Liquid Glass (`GlassSidebar`, já homologado) | Reimplementação do zero sobre a estrutura atual, não cherry-pick de `c5314dd` |

### 7.3 Sidebar e unificação — adaptação à estrutura atual (não reaplicar `c5314dd`)

O commit antigo (`c5314dd`) injetava a sidebar **de dentro de `BarraTopo`, sem precisar mudar nenhuma `page.tsx`** — essa ideia arquitetural continua válida e deve ser preservada. O que muda, além da estrutura de navegação ter evoluído (abaixo), é o **sistema visual**: com Liquid Glass definitivo, a sidebar nova deve nascer como `GlassSidebar` (`app/design-lab/_glass/componentes.tsx`, já homologado — hover, foco de teclado, `whileTap`, popover de conta animado) promovido para `app/_ui/`, não como um componente bento novo nem como cópia do `barra-lateral.tsx` antigo (que era bento). `app/_ui/barra-topo.tsx` evoluiu muito desde `c5314dd` (hoje tem cápsulas `/dashboard`, `/processos`, `/agenda` + menu "Mais" com Assistente/Concluídos/Dados/Avisos/Tags/Coordenações/Gestores/Fiscais/Fornecedores — conjunto maior que o de `c5314dd`).

**Sidebar**:
- Reconstituir `app/_ui/barra-lateral.tsx` **a partir da lista de navegação atual de `main`** (todas as cápsulas + todos os itens de "Mais" de hoje), não da lista antiga de `c5314dd`.
- Preservar o dock mobile atual (hoje: Painel/Contratos/Dados/Mais) — `c5314dd` já previa isso, só precisa confirmar que o conjunto de itens bate com o de `main` hoje.
- **Verificar antes de portar**: `c5314dd` corrigia "de passagem" um bug do menu "Mais" ficando fora da tela no celular — checar se `main` já resolveu isso de forma independente nesse meio-tempo antes de reaplicar a correção (evitar sobrepor uma correção já feita de outro jeito).

**Unificação Gestores/Fiscais**:
- Construir **em cima de `app/_pessoas-papel/lista.tsx` atual de `main`**, que recebeu 4 correções próprias depois do ancestral comum: botão de copiar em Fiscal/substituto (`55acc9a`), tag de ausência "Ausente" (`373cc51`), rolagem horizontal no mobile (`d80b5a7`), cadastro quando a pessoa já existe (`67ca2e3`). A versão unificada **tem que preservar as 4**, não substituir o arquivo pela versão antiga da branch.
- `app/fiscais/page.tsx`/`app/gestores/page.tsx` só viram redirecionamento/filtro depois de confirmar, um a um, que a lista unificada reproduz os 4 comportamentos corrigidos.
- Sem mudança de schema — `pessoa_papeis.papel` já suporta a consulta unificada (confirmado em `c5314dd`, "sem mexer no banco").

### 7.4 Backup permanente (banco + Storage) — integridade, retenção e restauração isolada

Diferente da rede de segurança pontual cogitada na rodada anterior, a decisão agora é por um **processo permanente**, não um snapshot único:

- **Banco**: o cron diário (`backup-diario.yml`) já existe e continua — nenhuma mudança necessária nele além do item de Storage abaixo.
- **Storage**: estender o mesmo workflow (ou um paralelo, mesma cadência) para também baixar o conteúdo do bucket `andamento-anexos` (gap confirmado em `GAPS.md`/`BRANCH_SYNC.md` anterior) e empacotá-lo junto do dump do dia — mesma retenção (90 dias) e mesmo destino (artefato do GitHub Actions + Google Drive), para manter um único ponto de recuperação por data em vez de dois processos descolados.
- **Integridade**: cada execução do backup deve validar que o `pg_dump` não terminou truncado (checar código de saída do `pg_dump`, não só a existência do arquivo) e que o snapshot de Storage bateu em contagem de arquivos com a listagem do bucket no momento da cópia — hoje nenhuma dessas duas checagens existe.
- **Retenção**: manter os 90 dias já praticados (consistente para banco e Storage) — não reduzir nem estender sem necessidade de produto declarada.
- **Restauração isolada (teste de restauração)**: definir uma rotina periódica (ex. trimestral) de restaurar o dump mais recente num projeto Supabase **isolado/descartável** (nunca o de produção) e confirmar que a aplicação sobe e os dados batem — hoje a existência do backup nunca foi testada via restauração de verdade. Esse teste deve rodar **antes** de qualquer integração grande (como esta), não só periodicamente.
- Antes do início da integração: rodar manualmente um ciclo completo (banco+Storage) fora do horário do cron, confirmar os dois artefatos e a restauração isolada, e registrar local/timestamp em `docs/DECISIONS.md`.

**Nunca armazenar dado ou segredo no Git** — os artefatos de backup (dumps, snapshots de Storage) vivem só em GitHub Actions Artifacts e Google Drive, nunca commitados; segredos de acesso (`SUPABASE_DB_URL`, credenciais do Drive) continuam só como GitHub Secrets, nunca em arquivo versionado — reafirmação da regra já vigente (`CLAUDE.md`), sem mudança de prática.

### 7.5 Automação de testes críticos de regressão (reaproveitando Playwright)

Hoje não existe suíte automatizada (`TESTS.md`). Para esta integração, promover os scripts Playwright já escritos (ad hoc, usados durante a homologação do `/design-lab`) para uma suíte permanente, **sem implementá-la agora** — plano:

| Teste | Reaproveita | Cobre |
|---|---|---|
| Navegação completa | Script de varredura cross-browser da homologação do `/design-lab` (Chromium/Firefox/WebKit × desktop/tablet/mobile × claro/escuro) | Toda rota do `ABAS`/`MAIS` atual acessível pela sidebar nova, zero erro de console, zero overflow |
| Fiscais/Gestores unificado | Novo, mesmo padrão dos scripts de homologação (Playwright + verificação de DOM) | Os 4 comportamentos que `main` corrigiu nas páginas separadas (§7.3) continuam presentes na tela unificada |
| Autenticação | Padrão já usado na auditoria do login (preenchimento de campos, toggle de senha, fluxo de erro) | `handleSubmit`/`entrarComGoogle`/estados de erro inalterados |
| Desempenho | Script de medição CDP `Performance.getMetrics` da homologação | CPU/bundle antes/depois de cada melhoria do grupo 3, sem regressão |
| Acessibilidade | Script de foco por teclado + contraste da homologação | Sidebar/unificação com mesmo contrato de acessibilidade do `/design-lab` (foco real, `prefers-reduced-motion`, contraste medido) |

Local sugerido para os scripts permanentes (quando a implementação for autorizada): `tests/regressao/` na raiz do projeto, versionado, rodável via `npm run test:regressao` — nome e estrutura exata a confirmar na etapa de implementação, não decidido aqui.

### 7.6 Checkpoints por etapa e rollback independente

Cada grupo (§7.2) é seu próprio checkpoint — critério de aceite antes de avançar pro próximo:
1. `tsc --noEmit` e `npm run build` limpos.
2. Testes de regressão do grupo (§7.5) passando.
3. Revisão humana (Caio) do grupo isolado, antes de iniciar o próximo.

Rollback independente por grupo:
- Se um grupo falhar em qualquer checkpoint: reverter só aquele grupo, voltando ao checkpoint de segurança da branch de trabalho (`101c9f5`, §7.0) — os demais grupos, já aprovados em checkpoints anteriores, não são afetados.
- Nenhum grupo chega a `main` antes de todos os checkpoints passarem — não há rollback de produção a fazer até a etapa final de merge.
- Depois de um eventual merge futuro: `git revert` do commit de merge específico (nunca `reset` forçado em `main`) — mesmo padrão já usado para o caso do login em `docs/design/MIGRATION.md`.

### 7.7 Responsividade, acessibilidade, segurança e Design System — preservação explícita

- **Responsividade/acessibilidade**: sidebar/dock/telas migradas seguem o contrato já homologado em `docs/design/DESIGN_SYSTEM.md`/`TESTS.md` (100dvh, toque ≥44px, `prefers-reduced-motion`, contraste medido, foco de teclado real) — esse contrato é o mesmo tanto para telas que ainda usam o sistema bento quanto para as migradas, não um padrão à parte por sistema visual.
- **Segurança**: escopo desta integração é navegação/visual/performance — nenhuma mudança deve tocar `lib/supabase/*`, RLS ou rotas de auth. Qualquer correção de segurança feita só em `main` nos arquivos tocados (ex. exigência de admin logado no callback OAuth do Google) deve ser conferida e preservada explicitamente, commit a commit, não presumida como "não afetada".
- **Design System — decisão finalizada**: Liquid Glass é o sistema definitivo (`docs/DECISIONS.md`). Isso inverte a regra anterior ("nunca misturar os dois sistemas") de uma proibição simétrica para uma **direção de migração**: nenhuma tela nova ou retrabalhada deve nascer no padrão bento antigo (`design-system/REGRAS.md`) — ver §10 para o novo status desse documento. Telas ainda não migradas continuam funcionando como estão até sua vez chegar na fila de migração progressiva; não é uma reescrita simultânea de tudo.

## 8. Preservação de componentes e tokens homologados — mapa de promoção (evita duplicidade)

Ao promover peças do `/design-lab` para `app/_ui/` durante a migração progressiva, a regra é **substituir, não duplicar**: cada componente bento equivalente é removido da tela no mesmo commit que introduz o componente Liquid Glass, nunca os dois coexistindo na mesma tela (regra já vigente, reafirmada). Mapa de equivalência (preenchido conforme cada tela migra — não uma mudança de código desta tarefa):

| Bento (produção, `app/_ui/`) | Liquid Glass (`/design-lab/_glass`, homologado) | Status |
|---|---|---|
| `CardBento` | `GlassCard` | Pronto pra promoção (hover/foco já homologados) |
| `BarraTopo` (navegação) | `GlassSidebar` (desktop) + `GlassDock` (mobile/tablet) | Pronto, ver §7.3 |
| `ControleSegmentado` | `GlassTabs` | Pronto |
| Gráfico de barras (`recharts`, Dashboard) | `GlassSparklineSVG` (se o caso de uso for tendência curta) ou manter `recharts` (se for comparação entre categorias — não são substitutos 1:1) | Avaliar por widget, não substituir às cegas |
| `lib/theme.ts` (`cor`, `card`, `botaoPrimario`) | `vidroNivel`, `vidro`, demais tokens Liquid Glass (mesmo arquivo, `lib/theme.ts`) | Já convivem no mesmo arquivo — não precisa de migração de token, só de uso nos componentes |

Qualquer componente bento sem equivalente homologado ainda (ex. `MedidorCircular`, `IndicadorUrgencia`) **permanece em uso** até ter uma versão Liquid Glass validada no `/design-lab` — não recriar do zero dentro da tela de produção durante a migração.

## 9. Sincronização obrigatória com `main` antes de novas tarefas

Lição desta divergência (ver seção 1): a partir de agora, **toda nova tarefa nesta branch começa com `git fetch origin main` + comparação de contagem** (`git rev-list --left-right --count origin/main...<branch>`). Se a branch estiver atrás de `main` por qualquer commit novo desde a última sincronização, resolver isso **antes** de somar trabalho novo — seguindo a convenção já estabelecida do projeto (reiniciar a branch do mesmo nome a partir do HEAD de `main` quando o PR anterior já foi mesclado, rebaseando o que ainda não foi mesclado por cima). Esta regra entra em `CLAUDE.md` nesta mesma atualização.

## 10. Documentação do Design System — status atualizado (sem duplicar conteúdo)

Mudança de status, não de conteúdo técnico (tokens/componentes continuam descritos só em `design-system/LIQUID_GLASS.md`/`docs/design/DESIGN_SYSTEM.md`, não repetidos aqui):

- `design-system/LIQUID_GLASS.md` — promovido de "padrão experimental, só login em produção" para **Design System definitivo do projeto**, com a migração progressiva como processo oficial (não mais "aguardando aprovação visual" tela por tela isolada).
- `design-system/REGRAS.md` — passa a **legado em desativação progressiva**: continua válido para qualquer tela que ainda não migrou (não se deve quebrar o que está de pé), mas nenhuma tela nova ou redesenho deve mais segui-lo como padrão de partida.
- `docs/design/DESIGN_SYSTEM.md` — adiciona nota de que deixou de ser "documentação de protótipo isolado" e passa a documentar o Design System real do produto, com `app/_ui/` como destino final dos componentes (não mais `/design-lab` como fim de linha).

Essas três mudanças de cabeçalho foram aplicadas nos respectivos arquivos nesta mesma rodada — ver cada um para o texto exato, não duplicado aqui.

## 11. Execução Fase 00.1–00.2 (2026-11-28) — status, impedimentos

> Esta seção registra o que foi de fato executado nesta data (não mais só plano) e os impedimentos encontrados, conforme pedido explícito de parar e informar quando houver bloqueio de segurança, acesso ou custo.

### 00.1 — Reconfirmação de HEADs e proteção das branches

| Item | Resultado |
|---|---|
| HEADs reconfirmados | `origin/main` = `0efae14` (inalterado); branch de trabalho = `101c9f5`; ancestral comum = `d1bac7f` (inalterado); contagem = 331 só em `main`, 43 só na branch |
| Deploy de produção (Vercel) | Reconfirmado: `0efae14`, sem mudança |
| Proteção de `origin/main` | **Bloqueada** — tentativa de `git push` de uma tag `safety/main-pre-integracao-20261128` apontando pro SHA de `origin/main` foi recusada pelo GitHub com HTTP 403. As credenciais deste ambiente têm push autorizado só pra branch nomeada `claude/crm-cofisc-conexao-9pot1u`, não pra novos refs (tags ou outras branches) |
| Proteção da branch de trabalho | **Bloqueada** pelo mesmo motivo — tag local criada e descartada (não é durável sem push; o container deste ambiente é efêmero) |
| Checkpoint registrado como alternativa | SHAs exatos documentados em §7.0: `origin/main` em `0efae14e81402af9336b48f8969e73a9a61f1a8a`, branch de trabalho em `101c9f528220d90cb0a0a90ec49c6d27b989fafc`. Válido como referência de rollback enquanto as tags reais não existem, mas **sem a garantia de durabilidade que uma tag genuína dá** (um SHA sem nenhum ref apontando pra ele pode, em tese, ser removido pelo coletor de lixo do GitHub se nada mais o referenciar) |

**Impedimento — ação pendente de Caio**: criar as duas tags manualmente (ou autorizar uma conta/token com permissão de push mais ampla neste ambiente). Comandos prontos, só rodar com acesso de escrita ao repositório:
```
git tag -a safety/main-pre-integracao-20261128 0efae14e81402af9336b48f8969e73a9a61f1a8a -m "Checkpoint de proteção pré-integração — produção"
git tag -a safety/branch-pre-integracao-20261128 101c9f528220d90cb0a0a90ec49c6d27b989fafc -m "Checkpoint de proteção pré-integração — branch de trabalho"
git push origin safety/main-pre-integracao-20261128 safety/branch-pre-integracao-20261128
```

### 00.2 — Backup permanente (banco + Storage), verificação e restauração isolada

**Impedimento de acesso, bloqueante para todo o escopo de 00.2**: o Supabase MCP conectado a esta sessão **não tem nenhum projeto do CRM-COFISC** — `list_organizations`/`list_projects` só retornam projetos de outro workspace ("Hub Financeiro Familiar"/"jarvis-família"), sem relação com este CRM. Confirmado também que este ambiente não tem acesso aos GitHub Secrets usados pelo workflow de backup real (`SUPABASE_DB_URL`, credenciais do Google Drive) — são secrets de CI, não expostos a este container por desenho.

Consequência, item a item do pedido:

| Item pedido | Status | Motivo |
|---|---|---|
| Implementar backup permanente do banco | **Não executado** | Sem acesso ao projeto Supabase real nem aos secrets que o workflow usaria — qualquer alteração em `backup-diario.yml` ficaria sem como ser testada de verdade nesta sessão. Escrever a mudança "às cegas" e chamá-la de implementada seria enganoso |
| Implementar backup permanente do Storage (`andamento-anexos`) | **Não executado** | Mesmo motivo — e é trabalho novo (não existe hoje, ver `GAPS.md`), não só estender algo já testado |
| Validar autorização institucional, destino, criptografia, acesso e retenção | **Não executado — decisão de Caio, não técnica** | São escolhas de política que esta sessão não pode presumir: quem deve ter acesso aos arquivos de backup, se o destino atual (artefato do GitHub Actions + pasta do Google Drive pessoal) é o aprovado pra dado institucional, se precisa de criptografia adicional além da que o Drive/GitHub já aplicam em repouso, qual a retenção formalmente exigida (hoje é 90 dias por convenção do workflow, nunca formalizada como política) |
| Verificar checksums/consistência entre registros e anexos | **Não executado** | Exige consulta real ao banco (`andamento_anexos`) e ao bucket de Storage — nenhum dos dois acessível nesta sessão |
| Testar restauração integral em ambiente isolado | **Não executado — bloqueio duplo** | (a) mesma falta de acesso ao projeto real; (b) mesmo com acesso, restaurar um dump em ambiente isolado significa provisionar um projeto Supabase novo (ou reativar um pausado) — **custo adicional recorrente ou pontual**, que não deve ser incorrido sem autorização explícita de Caio |

**Recomendação para destravar, quando Caio autorizar**: rodar esta mesma Fase 00.2 numa sessão/ambiente com (1) o Supabase MCP conectado ao projeto real do CRM-COFISC (ou acesso equivalente por CLI com a `SUPABASE_DB_URL`), e (2) autorização explícita pra criar um projeto Supabase temporário de teste de restauração (ciente do custo). Sem isso, qualquer "implementação" de backup permanente feita aqui seria código não validado contra o sistema real — risco maior do que não ter feito nada.

### Preservação de dados/credenciais/produção

Nenhum dado, credencial ou configuração de produção foi tocado nesta execução — as únicas ações reais foram leitura (HEADs, Vercel, Supabase MCP de outro projeto só pra confirmar a ausência de acesso) e uma tentativa de push de tag, recusada antes de qualquer efeito. `origin/main` e o deploy de produção seguem exatamente como estavam.

## 12. Resolução dos bloqueios de 00.1–00.2, sem custo adicional (2026-11-28, continuação)

> Reavaliação pedida explicitamente por Caio: "resolva os bloqueios... sem custo adicional". Não houve novo acesso ao projeto Supabase real nem a GitHub Secrets — a mudança foi separar o que de fato dependia disso do que podia ser verificado com infraestrutura local, gratuita e descartável. Nenhuma dependência redundante foi instalada no projeto (nada em `package.json`/manifesto committed), nenhum segredo foi exposto, nenhum dado foi transferido sem autorização, produção não foi alterada, nenhum serviço foi contratado.

### 00.1 (atualização) — HEADs/checkpoint reconfirmados

| Item | Resultado |
|---|---|
| HEADs reconfirmados | `origin/main` = `0efae14` (inalterado desde §11); branch de trabalho = `1dfdcda` (avançou — commit do `CRM_INTEGRATION.zip`); contagem = 331 só em `main`, 44 só na branch |
| Deploy de produção (Vercel) | Reconfirmado novamente: `0efae14`, sem mudança |
| Proteção por tag real | Ainda bloqueada pelo mesmo HTTP 403 (push restrito à branch nomeada) — não foi retentada, por instrução explícita de não contornar bloqueio de permissão. Comandos para Caio executar, atualizados para o checkpoint atual: |

```
git tag -a safety/main-pre-integracao-20261128 0efae14e81402af9336b48f8969e73a9a61f1a8a -m "Checkpoint de proteção pré-integração — produção"
git tag -a safety/branch-pre-integracao-20261128 1dfdcdae0148f44acc860ce0b732fa99b43902b7 -m "Checkpoint de proteção pré-integração — branch de trabalho"
git push origin safety/main-pre-integracao-20261128 safety/branch-pre-integracao-20261128
```

### 00.2 (atualização) — o que foi efetivamente destravado

Reavaliação do impedimento original: a falta de acesso ao projeto Supabase real via MCP bloqueia só a verificação end-to-end **contra dados de produção reais**. Ela não bloqueia (a) verificar se o *mecanismo* de backup/restauração funciona, usando infraestrutura local gratuita e descartável, nem (b) escrever o código que vai rodar dentro do GitHub Actions, que já tem (ou pode receber) os secrets reais sem este ambiente precisar vê-los.

| Item pedido | Status | Como foi verificado |
|---|---|---|
| Supabase CLI/API oficial, sem depender do MCP | **Viável, confirmado** | `npx -y supabase <comando>` funciona sem instalação persistente (versão 3.4.0 resolvida sob demanda) — não entra como dependência do projeto |
| Restauração isolada (schema) via Supabase CLI + Docker local | **Executado e verificado, custo zero** | Docker estava instalado mas o daemon não estava ativo; iniciado manualmente (`dockerd`) só para este teste. Copiadas as 50 migrações reais (`supabase/migrations/`) para um diretório descartável, `supabase init --force` + `supabase start`: as 50 aplicaram sem erro num Postgres 17.12 local. Verificado via `psql` direto: 30 tabelas (bate com `docs/audit/DATA_MODEL.md`), RLS ativo em 100% das tabelas (0 linhas na consulta de "RLS desligado"), funções `is_authorized()` e `is_admin()` presentes, 103 políticas RLS ativas. Stack derrubada depois (`supabase stop`), containers/volumes/diretórios removidos, ~8GB de imagens Docker podadas — sandbox devolvido limpo. **Importante: isto valida a restauração de ESTRUTURA (schema/RLS/migrações), não de DADOS reais** — não havia dados de produção disponíveis nem foram usados |
| Checksum/integridade (SHA-256 + manifesto) | **Mecanismo testado e verificado** | `scripts/gerar_manifesto.py` (novo): gera manifesto no formato padrão `sha256sum`. Testado com arquivo descartável: manifesto válido, `sha256sum -c` passa; arquivo corrompido de propósito → `FAILED` + exit code 1. Detecção de corrupção confirmada |
| Criptografia (age/GPG) | **Mecanismo testado e verificado** | Par de chaves `age` **descartável**, gerado e apagado só para o teste (nunca chave real): cifrado → decifrado → `diff` idêntico ao original. Round-trip confirmado |
| Backup do banco (pg_dump) | **Código preparado, não alterado o fluxo existente** | `backup-diario.yml` (produção, agendado) não foi tocado. A proposta de extensão usa `pg_dump --format=custom`, igual ao que já roda hoje |
| Backup do Storage (bucket `andamento-anexos`) | **Código novo preparado (`scripts/backup_storage.py`), não testado contra dados reais** | Usa a API REST oficial do Supabase Storage (só `requests`, já disponível em runner Python padrão — nenhuma dependência nova). Lista recursivamente e baixa preservando estrutura de pastas. Revisado por leitura, correto na lógica, mas sem bucket real pra exercitar aqui — fica pendente de validação por Caio num `workflow_dispatch` manual |
| Retenção GFS (7 diários / 4 semanais / 3 mensais) | **Lógica implementada e testada com dados sintéticos** | `scripts/retencao_gfs.py` (novo) — substitui o corte fixo de 90 dias (`limpa_backups_antigos` em `scripts/backup_para_drive.py`, que continua intocado/em uso até decisão em contrário). Testada a função pura `selecionar_para_manter()` com 400 dias de datas sintéticas (não é chamada real ao Drive): resultado determinístico correto — 7 diários mais recentes + 4 semanas ISO distintas + 3 meses distintos, com sobreposição esperada entre os grupos |
| Validar autorização institucional/destino/acesso/retenção | **Ainda decisão de Caio, não técnica** | Inalterado de §11 — nenhuma infraestrutura resolve isso, é política. A proposta de retenção GFS acima é uma sugestão técnica pronta pra aprovação, não uma decisão tomada |
| Verificar checksums/consistência entre registros reais e anexos reais | **Ainda não executado** | Continua exigindo acesso ao banco/Storage reais — fora do que "sem custo adicional" resolve. O mecanismo de verificação (acima) está pronto; falta o dado real pra rodar contra |
| Restauração isolada de DADOS reais (não só schema) | **Ainda não executado, mesmo motivo de §11** | Precisaria de um dump real pra restaurar — não disponível sem acesso ao projeto |

### Arquivos novos (propostos, não ativos, pendentes de commit/decisão)

- `scripts/backup_storage.py` — baixa um bucket do Supabase Storage via API REST oficial
- `scripts/gerar_manifesto.py` — gera manifesto SHA-256 (testado)
- `scripts/retencao_gfs.py` — retenção GFS 7/4/3 (lógica testada; import do `cliente_drive` de `backup_para_drive.py` feito tardio, dentro de `main()`, pra não exigir `google-api-python-client` só pra testar a lógica pura)
- `.github/workflows/backup-storage-proposto.yml` — workflow novo, `workflow_dispatch` apenas (nunca em agenda), não substitui `backup-diario.yml`. Lista nos comentários os novos GitHub Secrets necessários (nomes só, nenhum valor): `AGE_PUBLIC_KEY` (nova), `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` (já existem no Vercel — precisam ser adicionadas também como GitHub Secret, mesma chave, destino novo)

### Limitações que permanecem (não resolvidas por infraestrutura local)

1. Nenhuma verificação rodou contra o projeto Supabase real ou dados reais — só contra schema público (migrações já versionadas no repo) e dados sintéticos/descartáveis.
2. `backup_storage.py` não foi exercitado contra um bucket real — risco residual de algum detalhe da API (paginação além de 1000 itens, caracteres especiais em nomes de arquivo) só aparecer em uso real.
3. A ativação de qualquer peça disto em produção (rodar o workflow proposto com secrets reais, gerar o par de chaves `age` real e guardar a privada, adicionar `SUPABASE_SERVICE_ROLE_KEY` como GitHub Secret) depende de ações do Caio — nenhuma delas foi feita aqui.
4. Restauração de **dados** reais (não só estrutura) continua não verificada, e só pode ser verificada com acesso real ou custo de provisionamento — nenhum dos dois ocorreu aqui.
