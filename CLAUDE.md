# CRM-COFISC — convenções do projeto

## Regras operacionais

- Nunca credenciais em código ou no chat — Caio adiciona direto no Vercel/Supabase/GitHub Secrets.
- Toda alteração de schema (migração) é entregue como arquivo `.sql` pra Caio rodar manualmente no Supabase — nunca executada diretamente.
- Implementar em passos pequenos, um commit por ajuste quando fizer sentido.
- Documentar decisões relevantes no `LOG.md` (uma entrada por mudança, com o "porquê").
- Fluxo de deploy: commitar/push na branch de trabalho → merge pra `main` (produção, auto-deploy) só depois de rodar `tsc --noEmit` e `npm run build` limpos → se a mudança depender de migração, só mergear depois do Caio confirmar que rodou o SQL.
- **Merge pra `main` e qualquer deploy exigem autorização explícita do Caio, caso a caso** — mesmo com `tsc`/`build` limpos e testes de regressão passando. Vale em especial para a integração da branch de trabalho em andamento (`docs/audit/BRANCH_SYNC.md`): nenhum checkpoint (§7.6) autoriza merge/deploy por si só, cada um exige o "sim" de Caio separadamente.
- **Design System definitivo: Liquid Glass** (`design-system/LIQUID_GLASS.md`) — decisão final registrada em `docs/DECISIONS.md`. Ler esse documento antes de mexer em qualquer tela ou criar componente novo. Migração das telas de produção é **progressiva, pareada a melhorias funcionais** (nunca uma reescrita de tudo de uma vez) — plano em `docs/audit/BRANCH_SYNC.md` §7-10. Nenhuma tela nova ou redesenho deve nascer no padrão bento antigo.
- Padrão bento/dashboard antigo (`design-system/REGRAS.md`, `design-system/tokens.css`): **legado em desativação progressiva** — só consultar pra não quebrar uma tela que ainda não migrou; não usar como ponto de partida pra nada novo.
- Nunca misturar os dois sistemas visuais numa mesma tela — a migração troca a tela inteira, não mescla os dois.
- **Sincronizar com `main` antes de começar qualquer tarefa nova**: `git fetch origin main` + `git rev-list --left-right --count origin/main...<branch>`. Se a branch estiver atrás, resolver isso primeiro (reiniciar a branch do HEAD de `main` e rebasear o que não foi mesclado) antes de somar commits novos — ver `docs/audit/BRANCH_SYNC.md` para o incidente que motivou esta regra.

## Decisões técnicas (DT) — registro formal

Numeração estável de princípios operacionais, pra referenciar por número em vez de repetir texto. Onde o princípio já está detalhado em outra regra deste arquivo ou em outro documento, a entrada aqui é só o ponteiro — não duplicar o conteúdo.

- **DT-001 — Economia de tokens/contexto**: não reler, retestar ou reexplicar o que já foi validado e está documentado; reaproveitar resultado de checkpoint anterior; saída proporcional ao pedido, nunca maior "por garantia".
- **DT-002 — Proatividade operacional**: resolver bloqueios e avançar tarefas independentes dentro do que já está autorizado, sem parar pra perguntar o que o escopo já responde — mas nunca como atalho pra contornar uma autorização que falta (merge/deploy/produção/custo seguem exigindo o "sim" do Caio, ver regra de autorização explícita abaixo).
- **DT-003 — Responsividade integral**: toda tela/componente, novo ou alterado, funciona em qualquer largura de viewport — não é opcional nem adiável pra depois.
- **DT-004 — Preservar requisitos, dados e funcionalidades**: mudança é aditiva por padrão; nada existente (requisito, dado, funcionalidade, credencial, configuração de produção) é removido ou sobrescrito sem autorização explícita e sem antes preservar o que já havia (stash/branch/cópia em vez de descartar).
- **DT-005 — Skills sob demanda**: carregar/usar skill, ferramenta ou subagente só quando a tarefa concreta pedir, nunca especulativamente "pra garantir cobertura".
- **DT-006 — Liquid Glass definitivo, migração progressiva**: ver regra de Design System acima (`design-system/LIQUID_GLASS.md`, `docs/DECISIONS.md`).
- **DT-007 — Sincronização, versionamento e rollback seguro**: ver regra de sincronização com `main` acima e `docs/audit/BRANCH_SYNC.md` (checkpoints, tags de proteção, autorização explícita de merge/deploy).
- **DT-008 — Execução incremental, checkpoints, reaproveitamento, isolamento de bloqueios, continuidade independente**: toda tarefa de múltiplas etapas registra checkpoint em `EXECUTION_STATE.md` (subtarefa validada, o que foi reaproveitado, o que ficou bloqueado); retomada sempre a partir do último checkpoint válido ali, nunca do início; um bloqueio isola só a subtarefa afetada, sem travar as demais já autorizadas.
- **DT-009 — Sandbox reproduzível, dados sintéticos, custo zero**: verificação de mecanismo (schema, restauração, integridade, criptografia) roda em infraestrutura local/descartável com dados sintéticos antes de qualquer teste contra sistema ou dado real — nunca gera custo ou usa credencial real só para validar lógica.

Pendências abertas da linha de trabalho de backup (análise completa, não repetir): ver `EXECUTION_STATE.md` → "Pendente" e `docs/audit/BRANCH_SYNC.md` §13.

## Padrão de janela/popup (modal pequeno sobre a tela)

Usado em `app/_ui/popup-nome.tsx` e no modal de edição de `app/_pessoas-papel/lista.tsx`. Ao criar um novo popup/modal pequeno (não a tela cheia `/processos/[id]`, que é outro padrão), seguir:

- **Botão de fechar ("×") sempre `position: absolute`, fixo no canto superior direito do painel.** Nunca colocar o "×" na mesma linha flex que o título/nome disputando espaço com ele — quando o texto é grande, os dois espremem um no outro (foi exatamente o bug que o Caio pegou: nome comprido ficava colado/embaixo do "×").
- **Título/nome ocupa a linha inteira**, com `paddingRight` reservando o espaço do "×" absoluto, e `overflowWrap: "break-word"` pra quebrar linha livremente em vez de truncar com reticências ou estourar a largura da janela.
- **Ações relacionadas ao título** (ex.: "Copiar nome") ficam numa **linha própria abaixo do título**, não espremidas do lado do texto. Usar `BotaoCopiar` com `rotulo` (vira um botão "pill" com ícone + texto, ex. `rotulo="Copiar nome"`), mesmo visual do botão "Copiar objeto + unidade" já usado em Dados principais.
- **Largura do painel**: `maxWidth: "min(380px, calc(100vw - 48px))"` — nunca encosta nas bordas da tela, mesmo em telas estreitas.
- **Altura**: `maxHeight: "calc(100vh - 48px)"` + `overflowY: "auto"` — rola internamente em vez de estourar a tela se o conteúdo for grande.
- **Campo com mais de um valor** (ex.: vários e-mails de um fornecedor): listar cada valor na sua própria linha (legibilidade), mas com **um único** botão de copiar pra todos juntos (`join("; ")`) — não um botão por linha. Testado e revertido uma vez: copiar e-mail por e-mail parece fazer sentido mas na prática ninguém usa, o normal é precisar de todos de uma vez.
- Fundo escurecido (`rgba(32,31,29,.4)`) cobrindo a tela, clique fora fecha (`onClick` no overlay chama fechar; `onClick` no painel com `stopPropagation()` pra não fechar ao clicar dentro).
