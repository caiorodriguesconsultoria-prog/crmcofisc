# Conhecimento reutilizável — Liquid Glass / `/design-lab`

> Documento vivo do laboratório experimental (`app/design-lab/`). Ver
> `design-system/LIQUID_GLASS.md` pro documento consolidado (tokens,
> catálogo, contratos de acessibilidade/desempenho) — este arquivo aqui
> tem o detalhe/histórico de cada decisão. Status de produção: só a tela
> de login (`app/login/`) usa este sistema visual até agora (via a classe
> CSS já aprovada, não os componentes React deste laboratório); o resto
> segue experimental, aguardando aprovação visual. Serve também pra
> alimentar a skill `premium-liquid-ui` (ou o futuro Skill Studio da
> Software Factory) quando ela for instalada de verdade neste ambiente
> (hoje só o `SKILL.md`/descrição existe, sem os arquivos de suporte — ver
> "Limitações" no fim).

## Componentes aprovados (reutilizáveis)

Todos em `app/design-lab/_glass/componentes.tsx`, documentados com comentário de uso no próprio arquivo:

| Componente | Papel | Opacidade/material |
|---|---|---|
| `GlassSurface` | Superfície genérica, base dos outros | `vidro.padrao` (configurável via `alphaFundo`) |
| `GlassCard` | KPI/widget de dashboard | ~70% opaco (Caio, rodada 10) |
| `GlassWindow` | Janela de contrato/modal | ~50% opaco — mais vidro, mais decorativa |
| `GlassTable` | Tabela densa | Sólida, SEM vidro de propósito (regra: "reading" ≠ "regular"/"clear") |
| `GlassTimeline` | Cronograma/andamentos | Bolinha + linha, 3 status (concluído/atual/pendente), tag opcional por item (passo 6 — distingue "Ocorrência" de andamento comum) |
| `GlassDonut` | Gráfico de rosca com legenda | SVG puro, sem recharts (seria redundante — já é dependência, mas pra um donut simples não compensa) |
| `GlassIconChip` | Ícone colorido de cabeçalho de card | — |
| `GlassButton` / `GlassInput` / `GlassTabs` / `GlassPopover` / `GlassSheet` | Controles base | Variam por contexto (ver código); `GlassSheet` passou a ser usado de verdade no passo 7 (janela de contrato no mobile); `GlassPopover` ganhou entrada/saída animada no passo 9 (antes aparecia/sumia sem transição) |
| `GlassAIButton` | Botão flutuante do assistente | Pulso de glow sutil (`prefers-reduced-motion` respeitado); passo 8 — abre painel de chat de verdade (sugestões + histórico fictício "digitado" aos poucos, mesma estrutura do `/assistente` real em produção, sem chamada de rede) |
| `GlassDock` / `GlassSidebar` | Navegação mobile/desktop | Itens são `<button>` reais (fase 9 — não usar `<div>` decorativo); passo 9 — todos os botões (nav, Cadastros, dock) ganharam `whileTap`, que antes faltava |

## Técnicas validadas

- **Refração óptica real** (não só blur): `app/design-lab/_glass/refracao.tsx` — SVG `feTurbulence`+`feDisplacementMap` via `backdrop-filter: url(#id)`. Fallback `-webkit-` em blur puro (Safari historicamente não aplica filtro de referência em `backdrop-filter`).
- **Três níveis de opacidade, não um só**: janela (~50%) mais transparente que card (~70%) mais transparente que sidebar/dock (`vidro.padrao`/`intenso`, ~74-82%) — regra: quanto mais denso o conteúdo (texto/tabela), mais opaco.
- **`prefers-reduced-transparency`/`prefers-contrast` em JS**: inline style não vê `@media`. Hook `usePreferenciaMidia` (baseado em `matchMedia`) em `componentes.tsx` — com transparência reduzida, vidro vira ~97% opaco e `backdrop-filter` some por completo (não só o fallback de blur simples).
- **Motion**: `movimento.ease` (`lib/theme.ts`) é string CSS (`cubic-bezier(...)`) — funciona em propriedades aceleradas por GPU via WAAPI, mas o framer-motion instalado rejeita essa sintaxe pra propriedades animadas em JS (`height`, `boxShadow`). Usar array `[0.22, 1, 0.36, 1]` nesses casos.
- **Contraste não é só a cor declarada**: meça o pixel renderizado de verdade (amostragem via `sharp` + fórmula WCAG), não confie na combinação de cores "no papel" — vidro translúcido sobre fundo variável pode cair abaixo do mínimo em pontos específicos do card mesmo com cores "aprovadas" em produção sólida.

## Dependências — decisões e licenças

| Pacote | Decisão | Licença | Motivo |
|---|---|---|---|
| `@number-flow/react` 0.6.2 | ✅ Instalado | MIT | 25KB, zero dependências, anima dígito de KPI — ganho real, risco mínimo |
| `@paper-design/shaders-react` | ✅ Instalado, testado — ver abaixo | Apache-2.0 | `MeshGradient` (animado) é caro demais; `StaticMeshGradient` empata com o SVG atual em custo e é visualmente superior |
| shadcn/ui, Tremor | ❌ Rejeitado | MIT/Apache | Exigem Tailwind CSS como base — projeto não usa; trocar de paradigma de estilo só por isso contraria "evitar dependências redundantes" (já tenho `GlassButton`/`GlassDonut` com o mesmo papel) |
| 21st.dev | ❌ Rejeitado | Não declarada por componente | Registro copy-paste que embrulha bibliotecas de terceiros (Aceternity, Magic UI) sem licença clara por peça |
| motion-primitives.com, designeer.xyz | ❌ Não avaliado | Site bloqueou acesso (403) | Sem conseguir ver licença/conteúdo, não instalo — não é possível confirmar critério de "licença adequada" |
| ReactBits, MagicUI | ❌ Rejeitado | Variável | Genéricos de marketing, fora da linguagem visual já estabelecida; risco de licença por componente |
| Mobbin | — Referência | N/A | Galeria de prints reais, não é biblioteca de código |

## Teste de desempenho: `@paper-design/shaders-react` (fundo ambiental)

Comparação em `/design-lab/shader-teste` (3 modos lado a lado), medido via CDP `Performance.getMetrics` (não estimativa — `TaskDuration` real somado num intervalo de 3s parado, sem interação):

| Modo | Custo de CPU (3s parado) | Visual |
|---|---|---|
| SVG atual (`AmbientBackground`) | ~0% de 1 núcleo | Curvas bezier desenhadas à mão, boas mas "retas demais" em alguns ângulos |
| `MeshGradient` (shader **animado**) | **~104% de 1 núcleo, o tempo todo** | Muito fluido, orgânico |
| `StaticMeshGradient` (shader **sem animação**, renderiza 1x e para) | ~0% de 1 núcleo — empata com o SVG | Mesma riqueza visual do animado, sem o custo |

**Limitação importante da medição** (regra da própria skill: não declarar sem evidência): o Chromium headless deste ambiente não tem GPU real — `WEBGL_debug_renderer_info` confirma `SwiftShader` (renderização por software, via CPU). O número de ~104% do `MeshGradient` é především o custo de rodar o shader SEM aceleração de hardware; numa máquina real com GPU (mesmo integrada), isso tende a cair bastante. Não testei em hardware real — não afirmo que o `MeshGradient` animado é inviável em produção, só que não dá pra confirmar sem testar lá.

**Decisão original (incompleta — corrigida abaixo)**: a primeira leitura, baseada só no teste isolado (página vazia, só o fundo), apontava `StaticMeshGradient` como custo zero, igual ao SVG. **Essa conclusão estava errada por medir fora de contexto.**

### Correção: custo real aparece só com a página completa

Ao aplicar de verdade no `AmbientBackground` (usado por trás das telas reais do laboratório, com `GlassCard`/`GlassWindow`/botão de IA com glow pulsante etc.), o custo **voltou a aparecer, e de forma consistente** (3 execuções seguidas contra build de produção, não dev):

| Cenário (build de produção, não dev) | Custo de CPU (3s parado) |
|---|---|
| Dashboard completo, fundo SVG (antes) | ~1.8–2.2% de 1 núcleo |
| Dashboard completo, fundo `StaticMeshGradient` (depois) | **~55–60% de 1 núcleo, consistente em 3/3 execuções** |
| Fundo `StaticMeshGradient` sozinho, página vazia | ~0% |
| Fundo `StaticMeshGradient` + 1 `GlassCard` isolado | ~0% (não reproduziu sozinho) |

**Causa provável**: o dashboard tem animações contínuas decorativas já existentes (glow do botão de IA, pulso do sino — ambas da fase 8, independentes deste teste). Isoladas, com o SVG antigo, custam ~1,9% no total. Com o canvas WebGL por trás, parece que cada frame dessas animações força uma recomposição cara do canvas (ainda que ele mesmo não esteja desenhando nada novo) — bem mais caro que recompor pixels de um SVG estático. Um `GlassCard` sozinho, sem nenhuma animação contínua rodando, não reproduziu o custo — reforça que o gatilho é a combinação "canvas WebGL + algo animando continuamente em cima", não o shader ou o vidro isoladamente.

**Decisão final**: revertido. `AmbientBackground` voltou a usar o SVG. Dependência `@paper-design/shaders-react` continua instalada (não é problema em si — já provou license/qualidade boas) e a página `/design-lab/shader-teste` continua existindo como ferramenta de comparação, mas **não virou o fundo padrão**. Pra reconsiderar isso no futuro: (a) testar em hardware real com GPU de verdade (a ressalva do `SwiftShader`/software continua valendo — não sei quanto desse custo é específico deste sandbox), e (b) se for usar, considerar remover/pausar as animações contínuas decorativas enquanto o fundo for WebGL, já que parecem ser o gatilho do custo alto.

**Lição pro processo**: medir um recurso isolado não basta quando ele vai conviver com outras partes dinâmicas da tela real — o teste tem que incluir o contexto completo antes de declarar "sem custo".

### Confirmação final (passo 10 — auditoria de encerramento do plano "CRM Premium")

Remedida contra build de produção, depois de TODAS as adições dos passos 5-9 (sparklines, filtro real, menu de conta, painel de IA funcional, popovers animados, `whileTap` em toda navegação): dashboard completo, parado, idle = **~2,0-2,3% de 1 núcleo** — igual ao baseline do passo 3 (~1,8-2,2%), sem acúmulo de custo. Com o painel de IA aberto (árvore de componentes extra montada, mas sem animação contínua própria): **~2,0%**, mesma faixa. Janela de contrato no mobile (sheet, sem glow/pulso nenhum): **~0,09%**, like esperado — esta tela nunca teve animação contínua decorativa.

Confirma que a regra registrada acima ("CSS/SVG, nunca WebGL, em qualquer tela com animação contínua") continua sendo respeitada e que nenhuma das novas interações adicionadas neste plano introduziu custo de CPU residual.

## Erros encontrados e soluções

1. **Abas que trocavam visualmente mas não o conteúdo** (`/design-lab/janela`) — o seletor de aba mudava de estado, mas o corpo renderizava sempre "Resumo". Corrigido renderizando por `aba === "..."` de fato.
2. **Itens de navegação sem foco de teclado** — `<div>` no lugar de `<button>` em `GlassSidebar`/`GlassDock`. Sem isso, `Tab` nunca alcançava o item (parecia navegável, não era).
3. **Grade de cards quebrando o wrap no mobile** — fixar `gridTemplateColumns` em 5/3 colunas pra alinhar no desktop quebrou o empilhamento responsivo; corrigido condicionando ao estado `desktop` já existente.

## Limitações conhecidas

- **Testado só em Chromium headless (Playwright)** neste ambiente. Nenhuma evidência de Safari/WebKit, Firefox, ou dispositivo iOS/Android real — não declarar suporte lá sem testar de verdade.
- **A skill `premium-liquid-ui` não está instalada neste ambiente** — só o texto do `SKILL.md` foi enviado por upload, sem os arquivos de suporte (`assets/engine/liquid-glass.js`, `references/*.md`, `scripts/*.py`, wallpapers). Este documento existe justamente pra preencher esse papel até a skill real (ou o Skill Studio da Software Factory) estar disponível pra receber o conteúdo formalmente.
- **Painel do assistente de IA (passo 8) sem focus trap** — `Tab` alcança o botão "×" logo depois de abrir (ordem de DOM razoável), mas não existe nenhuma barreira impedindo `Tab` de sair do painel pro resto da página por trás, nem `Escape` pra fechar. Testado o suficiente pra confirmar que não quebra nada (foco não se perde), mas um focus trap de verdade (como teclado dentro de um modal real) ficaria pro dia que isso for promovido a produto.
