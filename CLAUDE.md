# CRM-COFISC — convenções do projeto

## Regras operacionais

- Nunca credenciais em código ou no chat — Caio adiciona direto no Vercel/Supabase/GitHub Secrets.
- Toda alteração de schema (migração) é entregue como arquivo `.sql` pra Caio rodar manualmente no Supabase — nunca executada diretamente.
- Implementar em passos pequenos, um commit por ajuste quando fizer sentido.
- Documentar decisões relevantes no `LOG.md` (uma entrada por mudança, com o "porquê").
- Fluxo de deploy: commitar/push na branch de trabalho → merge pra `main` (produção, auto-deploy) só depois de rodar `tsc --noEmit` e `npm run build` limpos → se a mudança depender de migração, só mergear depois do Caio confirmar que rodou o SQL.

## Padrão de janela/popup (modal pequeno sobre a tela)

Usado em `app/_ui/popup-nome.tsx` e no modal de edição de `app/_pessoas-papel/lista.tsx`. Ao criar um novo popup/modal pequeno (não a tela cheia `/processos/[id]`, que é outro padrão), seguir:

- **Botão de fechar ("×") sempre `position: absolute`, fixo no canto superior direito do painel.** Nunca colocar o "×" na mesma linha flex que o título/nome disputando espaço com ele — quando o texto é grande, os dois espremem um no outro (foi exatamente o bug que o Caio pegou: nome comprido ficava colado/embaixo do "×").
- **Título/nome ocupa a linha inteira**, com `paddingRight` reservando o espaço do "×" absoluto, e `overflowWrap: "break-word"` pra quebrar linha livremente em vez de truncar com reticências ou estourar a largura da janela.
- **Ações relacionadas ao título** (ex.: "Copiar nome") ficam numa **linha própria abaixo do título**, não espremidas do lado do texto. Usar `BotaoCopiar` com `rotulo` (vira um botão "pill" com ícone + texto, ex. `rotulo="Copiar nome"`), mesmo visual do botão "Copiar objeto + unidade" já usado em Dados principais.
- **Largura do painel**: `maxWidth: "min(380px, calc(100vw - 48px))"` — nunca encosta nas bordas da tela, mesmo em telas estreitas.
- **Altura**: `maxHeight: "calc(100vh - 48px)"` + `overflowY: "auto"` — rola internamente em vez de estourar a tela se o conteúdo for grande.
- **Campo com mais de um valor** (ex.: vários e-mails de um fornecedor): listar cada valor na sua própria linha (legibilidade), mas com **um único** botão de copiar pra todos juntos (`join("; ")`) — não um botão por linha. Testado e revertido uma vez: copiar e-mail por e-mail parece fazer sentido mas na prática ninguém usa, o normal é precisar de todos de uma vez.
- Fundo escurecido (`rgba(32,31,29,.4)`) cobrindo a tela, clique fora fecha (`onClick` no overlay chama fechar; `onClick` no painel com `stopPropagation()` pra não fechar ao clicar dentro).
