# Conhecimento reutilizável — Liquid Glass / `/design-lab`

> Documento vivo do laboratório experimental (`app/design-lab/`). Nada aqui
> foi aplicado ao CRM funcional ainda — fica registrado pra quando a
> migração for aprovada, e pra alimentar a skill `premium-liquid-ui` (ou o
> futuro Skill Studio da Software Factory) quando ela for instalada de
> verdade neste ambiente (hoje só o `SKILL.md`/descrição existe, sem os
> arquivos de suporte — ver "Limitações" no fim).

## Componentes aprovados (reutilizáveis)

Todos em `app/design-lab/_glass/componentes.tsx`, documentados com comentário de uso no próprio arquivo:

| Componente | Papel | Opacidade/material |
|---|---|---|
| `GlassSurface` | Superfície genérica, base dos outros | `vidro.padrao` (configurável via `alphaFundo`) |
| `GlassCard` | KPI/widget de dashboard | ~70% opaco (Caio, rodada 10) |
| `GlassWindow` | Janela de contrato/modal | ~50% opaco — mais vidro, mais decorativa |
| `GlassTable` | Tabela densa | Sólida, SEM vidro de propósito (regra: "reading" ≠ "regular"/"clear") |
| `GlassTimeline` | Cronograma/andamentos | Bolinha + linha, 3 status (concluído/atual/pendente) |
| `GlassDonut` | Gráfico de rosca com legenda | SVG puro, sem recharts (seria redundante — já é dependência, mas pra um donut simples não compensa) |
| `GlassIconChip` | Ícone colorido de cabeçalho de card | — |
| `GlassButton` / `GlassInput` / `GlassTabs` / `GlassPopover` / `GlassSheet` | Controles base | Variam por contexto (ver código) |
| `GlassAIButton` | Botão flutuante do assistente | Pulso de glow sutil (`prefers-reduced-motion` respeitado) |
| `GlassDock` / `GlassSidebar` | Navegação mobile/desktop | Itens são `<button>` reais (fase 9 — não usar `<div>` decorativo) |

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
| `@paper-design/shaders-react` | ⏳ Candidato, não instalado | Apache-2.0 | WebGL, ~430KB — vale testar desempenho antes de trocar o fundo SVG atual |
| shadcn/ui, Tremor | ❌ Rejeitado | MIT/Apache | Exigem Tailwind CSS como base — projeto não usa; trocar de paradigma de estilo só por isso contraria "evitar dependências redundantes" (já tenho `GlassButton`/`GlassDonut` com o mesmo papel) |
| 21st.dev | ❌ Rejeitado | Não declarada por componente | Registro copy-paste que embrulha bibliotecas de terceiros (Aceternity, Magic UI) sem licença clara por peça |
| motion-primitives.com, designeer.xyz | ❌ Não avaliado | Site bloqueou acesso (403) | Sem conseguir ver licença/conteúdo, não instalo — não é possível confirmar critério de "licença adequada" |
| ReactBits, MagicUI | ❌ Rejeitado | Variável | Genéricos de marketing, fora da linguagem visual já estabelecida; risco de licença por componente |
| Mobbin | — Referência | N/A | Galeria de prints reais, não é biblioteca de código |

## Erros encontrados e soluções

1. **Abas que trocavam visualmente mas não o conteúdo** (`/design-lab/janela`) — o seletor de aba mudava de estado, mas o corpo renderizava sempre "Resumo". Corrigido renderizando por `aba === "..."` de fato.
2. **Itens de navegação sem foco de teclado** — `<div>` no lugar de `<button>` em `GlassSidebar`/`GlassDock`. Sem isso, `Tab` nunca alcançava o item (parecia navegável, não era).
3. **Grade de cards quebrando o wrap no mobile** — fixar `gridTemplateColumns` em 5/3 colunas pra alinhar no desktop quebrou o empilhamento responsivo; corrigido condicionando ao estado `desktop` já existente.

## Limitações conhecidas

- **Testado só em Chromium headless (Playwright)** neste ambiente. Nenhuma evidência de Safari/WebKit, Firefox, ou dispositivo iOS/Android real — não declarar suporte lá sem testar de verdade.
- **A skill `premium-liquid-ui` não está instalada neste ambiente** — só o texto do `SKILL.md` foi enviado por upload, sem os arquivos de suporte (`assets/engine/liquid-glass.js`, `references/*.md`, `scripts/*.py`, wallpapers). Este documento existe justamente pra preencher esse papel até a skill real (ou o Skill Studio da Software Factory) estar disponível pra receber o conteúdo formalmente.
