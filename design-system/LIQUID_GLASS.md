# Design System Liquid Glass (CRM Premium)

Consolidação do Design System proprietário construído em `/design-lab`
(fases 1-11) e já validado em produção na tela de login (`app/login/`).
Coexiste com `REGRAS.md` (o redesenho bento/dashboard, já aprovado e em
produção em outras telas) — são dois sistemas visuais paralelos, cada um
com seu próprio status e escopo de telas:

| | `REGRAS.md` (bento/dashboard) | Este documento (Liquid Glass) |
|---|---|---|
| Status | Aprovado, em produção | Login em produção; resto experimental em `/design-lab` |
| Visual | Cores sólidas, sem vidro/desfoque | Vidro translúcido, refração, fundo ambiental |
| Fonte de tokens | `lib/theme.ts` (`cor`, `card`, `raio`) | `lib/theme.ts` (`vidro`, `vidroNivel`) |

**Não misturar os dois num mesmo card/tela** sem decisão explícita — cada
tela do produto pertence a um sistema ou outro.

## Fonte única dos tokens

`lib/theme.ts`:
- `vidro.padrao` / `vidro.intenso` — presets de blur+saturação+opacidade base.
- `vidroNivel` — opacidade por papel de uso (consolidado no passo 2, antes eram números soltos repetidos em vários arquivos):
  - `vidroNivel.janela` (**0.5**) — janela de contrato/modal, decorativa, mais vidro.
  - `vidroNivel.cartao` (**0.7**) — card/KPI de dashboard, mais sólido que a janela.
  - `vidroNivel.navegacao` (**0.82**, = `vidro.padrao.alphaFundo`) — sidebar/popover.
  - `vidroNivel.dock` (**0.74**, = `vidro.intenso.alphaFundo`) — dock mobile/sheet.

Regra geral: quanto mais denso o conteúdo (texto corrido, tabela), **mais
opaco** — nunca o inverso. Tabelas (`GlassTable`) não usam vidro algum, de
propósito.

## Catálogo de componentes

Protótipos em `app/design-lab/_glass/componentes.tsx` (ainda não promovidos
a `app/_ui/`); usados diretamente em produção na tela de login via a
classe CSS equivalente já aprovada (`.crm-cartao-vidro-claro`, não os
componentes React do laboratório — ver "Status de produção" abaixo).

| Componente | Papel |
|---|---|
| `GlassSurface` / `GlassCard` / `GlassWindow` | Superfícies base |
| `GlassTable` | Leitura densa — sólida, sem vidro |
| `GlassTimeline` / `GlassDonut` / `GlassIconChip` | Dados/decoração |
| `GlassButton` / `GlassInput` / `GlassTabs` / `GlassPopover` / `GlassSheet` | Controles |
| `GlassAIButton` / `GlassDock` / `GlassSidebar` | Navegação/assistente |

Detalhe de cada um, com motivo de cada decisão de design, em
`app/design-lab/CONHECIMENTO.md`.

## Status de produção (o que já saiu do laboratório)

- **Tela de login** (`app/login/`): único caso de uso real até agora. Usa
  a classe CSS `.crm-cartao-vidro-claro` (`app/globals.css`) — a mesma já
  aprovada nos cards do Painel — e NÃO os componentes React do
  `/design-lab/_glass` (que continuam marcados como laboratório). Fundo
  animado em CSS/SVG puro (esferas), não WebGL. Ver `app/login/CONHECIMENTO.md`.
- **Resto** (dashboard, janela de contrato, Andamentos/Relatório): só em
  `/design-lab`, aguardando aprovação visual antes de migrar.

## Contrato de acessibilidade (obrigatório em qualquer tela deste sistema)

- **Contraste**: medir o pixel renderizado de verdade (cor computada do
  texto + amostra do fundo composto), nunca só a combinação de cores "no
  papel" — vidro translúcido sobre fundo variável pode cair abaixo de
  4,5:1 mesmo com cores aprovadas em contexto sólido.
- **Foco de teclado**: todo elemento interativo é `<button>`/`<a>` real,
  nunca `<div>` decorativo. Nunca usar `outline: none`.
- **Alvos de toque**: ≥44px no mobile (desktop pode ser mais compacto).
- **`prefers-reduced-motion`**: zero animação (incluindo "respiração"
  contínua) quando ativo — checar com `useReducedMotion()` em todo
  componente que anima.
- **`prefers-reduced-transparency`**: vidro vira ~97% opaco, sem
  `backdrop-filter` nenhum (não só o fallback de blur simples).
- **`prefers-contrast: more`**: bordas reforçadas (ver `materialVidro()`).

## Contrato de desempenho

- **Fundo ambiental**: CSS/SVG, nunca WebGL/shader, se a tela tiver
  qualquer animação contínua rodando por cima (ver o caso medido —
  `@paper-design/shaders-react` ficou ~55-60% de 1 núcleo nessa
  combinação, contra ~2% antes). Se não houver nenhuma animação contínua
  na tela, shader estático pode ser reconsiderado, mas meça de novo — não
  reaproveite a medição de outra tela.
- **Motion**: `movimento.ease` (`lib/theme.ts`) é string CSS, inválida pro
  framer-motion em propriedades animadas via JS (`height`, `boxShadow`).
  Usar array `[0.22, 1, 0.36, 1]` nesses casos; strings CSS funcionam
  normalmente em `opacity`/`transform` (WAAPI).

## Dependências aprovadas até agora

| Pacote | Uso | Licença |
|---|---|---|
| `@number-flow/react` | Números de KPI animados | MIT |
| `framer-motion` | Já era dependência | MIT |
| `lucide-react` | Já era dependência | ISC |

`@paper-design/shaders-react` está instalado mas sem uso ativo em produto
(ver contrato de desempenho acima). Lista completa de fontes avaliadas e
rejeitadas (shadcn/ui, Tremor, 21st.dev, ReactBits, MagicUI, etc.), com
motivo de cada rejeição, em `app/design-lab/CONHECIMENTO.md`.

## Onde cada coisa vive

- Decisões de design, erros/soluções, histórico de medições → `app/design-lab/CONHECIMENTO.md`
- Decisões específicas da tela de login → `app/login/CONHECIMENTO.md`
- Tokens → `lib/theme.ts` (`vidro`, `vidroNivel`)
- Componentes → `app/design-lab/_glass/componentes.tsx` (protótipo) — promoção pra `app/_ui/` só depois de aprovação visual, tela por tela

Este arquivo é o ponto de entrada; os outros dois `CONHECIMENTO.md` têm o
"porquê" de cada decisão em detalhe. Serve também de base pra alimentar a
skill `premium-liquid-ui`/Skill Studio quando existirem de verdade neste
ambiente (hoje só o `SKILL.md`-descrição foi enviado, sem os arquivos de
suporte).
