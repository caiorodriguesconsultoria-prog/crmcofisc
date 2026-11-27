# Design System — Liquid Glass (`/design-lab`)

> Documentação de encerramento das 10 etapas do plano "CRM Premium". Fonte única dos valores: `lib/theme.ts` (código, não duplicado aqui) — este documento descreve o que existe e por quê. Para o histórico de decisão de cada valor, ver `design-system/LIQUID_GLASS.md` (consolidação) e `app/design-lab/CONHECIMENTO.md` (log técnico completo).
>
> **Dois sistemas visuais coexistem no projeto, nunca misturados na mesma tela**: o bento/dashboard (`design-system/REGRAS.md`) e o Liquid Glass aqui descrito. Hoje o Liquid Glass está em produção só na tela de login; o resto vive em `/design-lab` como protótipo.

## Cores

Todas em `lib/theme.ts`, exportadas como `cor` (tema claro) e `corEscuro` (tema escuro).

| Token | Valor | Uso |
|---|---|---|
| `cor.fundo` | `#EFF3FB` | Fundo base (fora do Liquid Glass) |
| `cor.texto` / `textoSecundario` / `textoTerciario` | `#201F1D` / `#605D5D` / `#6E6A6A` | Hierarquia de texto — todas as três passam WCAG AA (4,5:1+) contra fundo claro, medido, não assumido |
| `cor.destaque` / `azul` | `#2F5FDB` | Acento de marca único — links, pílulas ativas, botões primários |
| `cor.destaqueFundo` | `rgba(47,95,219,.10)` | Fundo leve do acento (chips, hover) |
| `cor.verdeEscuro` / `atencao` / `urgente` | `#2F6B4F` / `#C08A3E` / `#B0655C` | Estados (sucesso/atenção/urgente) — cada um com variante `*Fundo` para chip e `*Texto` escurecida para texto pequeno (4,9:1+) |
| `cor.escuro` | `#021024` | Azul-marinho — base de elementos "escuros" no tema claro (card de destaque) |
| `corEscuro.fundo` / `superficie` | `#060B16` / `#0E1526` | Tema escuro completo, paleta própria (não é um simples invert) |
| `PALETA_VIVA` / `PALETA_EVENTOS` | 8 cores cada | Paletas categóricas (gráficos, tags de evento) — estáveis por id, não por ordem |

## Vidro (Liquid Glass) — o material central do sistema

Três camadas por superfície (`materialVidro()` em `componentes.tsx`): **camada óptica** (`backdrop-filter: blur + saturate`, com refração via SVG `feDisplacementMap`, ver `refracao.tsx`) → **material** (gradientes de luz radiais/lineares) → **borda/reflexo** (`border-top` mais claro, simula luz incidindo de cima).

**Modelo de três níveis de opacidade** (`vidroNivel`, consolidado no passo 2 — antes eram números soltos repetidos em vários arquivos):

| Nível | Valor | Onde | Por quê |
|---|---|---|---|
| `janela` | **0,5** (50%) | Janela de contrato/modal | Superfície decorativa principal — mais transparente, não carrega texto denso linha a linha sozinha |
| `cartao` | **0,7** (70%) | Card/KPI | Mais sólido — carrega número/texto curto que precisa ficar legível com o fundo variando |
| `navegacao` | 0,82 (preset `padrao`) | Sidebar/popover | Mesmo material já aprovado em produção (`.crm-cartao-vidro-claro`) |
| `dock` | 0,74 (preset `intenso`) | Dock mobile/sheet | Mais evidente, pensado para toque |

Regra geral: **conteúdo mais denso → mais opaco**, nunca o inverso. `GlassTable` nunca usa vidro (sempre superfície sólida de leitura — tabela com texto denso lê mal sobre fundo variável).

Valores de `blur`/`saturate` (`vidro.padrao` = 22px/180%, `vidro.intenso` = 28px/190%) calibrados dentro da faixa que a Apple usa em seus materiais — testado acima disso (30px/200%) e piorou a legibilidade do texto.

**Contrato de acessibilidade do vidro** (`usePreferenciaMidia`, hook reaproveitado nos dois casos):
- `prefers-reduced-transparency: reduce` → `backdropFilter: none`, fundo quase opaco (0,97)
- `prefers-contrast: more` → borda reforçada (mais visível contra o fundo)

## Tipografia

Sem fonte própria do Liquid Glass — reaproveita a pilha tipográfica já em produção (sistema padrão do navegador, sem webfont customizada). Tamanhos usados no protótipo: 10-11px (rótulos/legendas uppercase), 12,5-13,5px (corpo/tabela), 15-19px (títulos de card/janela), pesos 600 (semibold, padrão de rótulo) e 700/800 (títulos e números de destaque).

## Espaçamentos e raios

`raio` (`lib/theme.ts`): `campo` 14px, `cardPequeno` 20px, `card` 22px, `painel` 24px (janelas/sheets), `pilula` 999px (tags, abas, botões). `elevacao`: escala de z-index centralizada (`fundo` 0 → `card` 10 → `navegacao` 20 → `janela` 30 → `popover` 40 → `notificacao` 50) — existe especificamente para evitar conflitos como "chat flutuante por baixo de um modal".

## Efeitos e sombras

- `sombraCard`: `0 1px 2px rgba(32,31,29,.06), 0 18px 40px rgba(32,31,29,.14)` — sombra dupla (contato + flutuação).
- Refração óptica real via SVG `feTurbulence` + `feDisplacementMap` (`refracao.tsx`) aplicada no `backdropFilter` das superfícies de vidro — testado só em Chromium; Safari/WebKit cai no fallback `blur+saturate` puro (a propriedade sem prefixo com filtro de referência é ignorada por engines que não suportam, de propósito).
- Esferas 3D ambientais: CSS puro (`radial-gradient` + `box-shadow`), nunca WebGL — ver nota de desempenho abaixo.

## Componentes

Inventário completo com arquivos/linhas em `COMPONENTS.md`. Resumo de família: superfícies (`GlassSurface`, `GlassCard`, `GlassWindow`, `GlassSheet`, `GlassPopover`), navegação (`GlassSidebar`, `GlassDock`, `GlassTabs`), controles (`GlassButton`, `GlassInput`), dados (`GlassTable`, `GlassDonut`, `GlassTimeline`, `GlassSparkline`), decorativos (`GlassIconChip`, `GlassAIButton`).

## Animações

Tokens em `movimento` (`lib/theme.ts`): `ease` (cubic-bezier `[0.22, 1, 0.36, 1]` — string CSS; para propriedades animadas via motor JS do framer-motion como `height`/`boxShadow`, usar a forma de array numérico, não a string, ou lança erro em runtime — bug pré-existente identificado nesta rodada), durações fixas para fade/entrada/contagem, e duas molas (`springHover` 400/30, `springPress` 500/25) reservadas para gestos (hover/toque), nunca para texto/número (spring faria o número oscilar antes de assentar).

Catálogo de microinterações implementadas: entrada escalonada de grade (`staggerChildren`), crossfade de abas, grupo expansível com altura animada, elevação no hover de card (reaproveitada de `CardBento`, produção), `whileTap` em toda navegação (sidebar, dock, Cadastros), popovers com entrada/saída animada (fade + escala), pulso de glow no botão de IA e no sino de notificação (gated por `prefers-reduced-motion`), transição do número dos KPIs (`@number-flow/react`).

**Focus trap no painel de IA** (homologação final): `Tab`/`Shift+Tab` cicla só entre os elementos focáveis do painel, `Escape` fecha, e o foco volta pro botão que abriu ao fechar — antes disso, `Tab` conseguia escapar do painel pro resto da página e `Escape` não fazia nada (ver `TESTS.md`).

**Lição de desempenho validada** (ver `TESTS.md` para os números): fundo ambiental deve ser **sempre CSS/SVG, nunca WebGL/shader**, em qualquer tela com animação contínua — o custo não vem do shader isolado, vem da combinação canvas WebGL + qualquer animação rodando por cima.

## Responsividade

Três telas, três estratégias — cada uma para o tipo de tela certo:
- **Dashboard** (`/design-lab`): três estados (`mobile` <768px, `tablet` 768-1023px, `desktop` ≥1024px — corrigido na homologação final, ver `TESTS.md`). Mobile e tablet usam dock de navegação (a sidebar fixa de 288px não cabe em nenhum dos dois); tablet usa grades intermediárias (3 colunas de KPI, 2 de bento) com scroll normal; só desktop mantém sidebar + grade de 5/3 colunas + altura travada em 100vh ("ver tudo sem rolar").
- **Janela de contrato** (`/design-lab/janela`, passo 7): abaixo de 768px vira **bottom sheet nativo** (`GlassSheet`, sobe do rodapé, faixa de arrasto, cantos só no topo) em vez da janela flutuante centralizada do desktop — é uma experiência mobile *independente*, não a mesma UI encolhida. Em 768-1023px (tablet) já cai no mesmo tratamento do desktop (janela flutuante centralizada, só encolhe) — não tem o problema do dashboard porque nunca teve grade de colunas fixas.
- **Login** (produção): duas colunas (identidade + formulário) acima de 900px; abaixo disso, formulário centralizado sozinho.

Testado sem overflow horizontal em nenhuma combinação (Chromium/Firefox/WebKit × mobile/tablet/desktop × claro/escuro) — ver `TESTS.md`.

**Gap encontrado na auditoria final** (ver `TESTS.md` e `MIGRATION.md`): o dashboard não tem um terceiro estado para tablet (~768-1024px) — na largura exata de 768px ele já cai no modo "desktop" com grade de 5/3 colunas fixas, causando corte horizontal de conteúdo. A janela de contrato e o login não têm esse problema (ambos degradam bem em 768px). Documentado como pendência, não corrigido nesta rodada (fora do escopo do plano de 10 passos, que não pedia um terceiro breakpoint).
