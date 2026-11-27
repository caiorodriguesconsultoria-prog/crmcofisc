# Inventário de componentes — Liquid Glass

> Todos os componentes abaixo vivem em `app/design-lab/_glass/componentes.tsx` (1003 linhas), exceto onde indicado. Nenhum foi promovido a `app/_ui/` — ainda são protótipo, por decisão explícita do plano ("Design Lab para experimentações, sem interromper o desenvolvimento").

## Superfícies de vidro

| Componente | Linha | Descrição | Reutilização |
|---|---|---|---|
| `GlassSurface` | 107 | Base de todas as outras — monta `materialVidro()` num `motion.div`, aceita pass-through de `variants`/`initial`/`animate`/`exit`/`whileHover`/`whileTap` | Todo outro componente de vidro é construído em cima deste |
| `GlassCard` | 127 | Card KPI/dashboard, `alphaFundo: vidroNivel.cartao` (70%), hover de elevação (`y:-3` + sombra) | **Reaproveita `usarPodeHover()`** (`app/_ui/usar-pode-hover.ts`, hook já em produção) e o padrão de hover de `CardBento` (`app/_ui/card-bento.tsx`) — não inventado do zero |
| `GlassWindow` | 156 | Janela de contrato/modal, `alphaFundo: vidroNivel.janela` (50%) | — |
| `GlassSheet` | 482 | Bottom sheet mobile, vidro intenso (~70%), sobe do rodapé | Existia desde a fase 7/8 mas só passou a ser **usado de verdade** no passo 7 (janela de contrato no mobile) |
| `GlassPopover` | 463 | Popover pequeno (menu de conta, filtro) | Ganhou entrada/saída animada no passo 9 |

## Navegação

| Componente | Linha | Descrição | Reutilização |
|---|---|---|---|
| `GlassSidebar` | 808 | Sidebar desktop — itens de nav, grupo "Cadastros" expansível, rodapé de conta com menu (`GlassPopover`) | Espelha a estrutura real de `app/_ui/barra-lateral.tsx` (produção) |
| `GlassDock` | 740 | Dock inferior mobile — itens como `<button>` reais, min. 44×44px | — |
| `GlassTabs` | 389 | Abas segmentadas, pílula ativa animada por `layoutId` | Mesma mecânica de `app/_ui/controle-segmentado.tsx` (produção) |

## Controles

| Componente | Linha | Descrição | Reutilização |
|---|---|---|---|
| `GlassButton` | 307 | Botão volumétrico (luz no topo + sombra), variante `primario` | — |
| `GlassInput` | 349 | Campo de texto — ganhou `value`/`onChange`/`disabled` opcionais no passo 8 (antes só decorativo) | — |

## Dados

| Componente | Linha | Descrição | Dependência |
|---|---|---|---|
| `GlassTable` | 167 | Tabela — **nunca vidro**, sempre superfície sólida de leitura (regra do sistema: texto denso não deve ficar sobre fundo variável) | Nenhuma |
| `GlassDonut` | 211 | Rosca com legenda | Desenhado à mão (SVG puro) — decisão deliberada de não somar `recharts` só para isso |
| `GlassTimeline` | 271 | Timeline numerada (andamentos/cronograma) — ganhou campo opcional `tag` no passo 6 | Nenhuma |
| `GlassSparkline` | 986 | Mini-gráfico de área sem eixo/tooltip | `recharts` (`AreaChart`/`Area`/`ResponsiveContainer`) — já dependência do projeto, mas **custo de bundle real**: a rota `/design-lab` não importava `recharts` antes (+93KB de First Load JS só nela, ver `TESTS.md`) |

## Decorativos

| Componente | Linha | Descrição | Dependência |
|---|---|---|---|
| `GlassIconChip` | 199 | Chip de ícone colorido | `lucide-react` |
| `GlassAIButton` | 533 | Botão flutuante de IA — **a partir do passo 8, abre um painel de chat funcional** (sugestões, histórico simulado, resposta "digitada" aos poucos) | `lucide-react` (`Sparkles`, `Send`) |

## Hooks utilitários

| Hook | Linha | Descrição |
|---|---|---|
| `usePreferenciaMidia(query)` | 15 | Wrapper de `matchMedia` reativo — usado para `prefers-reduced-transparency`, `prefers-contrast` e breakpoint mobile (`max-width: 767px`) |
| `useAbrirFechar(inicial)` | 977 | `useState` nomeado para toggle de aberto/fechado — utilitário simples |

## Outros arquivos do protótipo

| Arquivo | Linhas | Conteúdo |
|---|---|---|
| `app/design-lab/page.tsx` | 357 | Dashboard de demonstração — dados fictícios |
| `app/design-lab/janela/page.tsx` | 265 | Janela de contrato de demonstração — dados fictícios |
| `app/design-lab/_glass/ambient-background.tsx` | 105 | Fundo ambiental (SVG + esferas CSS) |
| `app/design-lab/_glass/refracao.tsx` | 33 | Filtro SVG de refração óptica (`feDisplacementMap`) |
| `app/design-lab/shader-teste/page.tsx` | — | Ferramenta de comparação de desempenho (SVG vs. shader animado vs. estático) — mantida como instrumento de medição, não como produto |

## Dependências instaladas para este plano

| Pacote | Versão | Licença | Uso | Status |
|---|---|---|---|---|
| `@number-flow/react` | ^0.6.2 | MIT | Transição animada de número nos KPIs | Em uso no protótipo |
| `@paper-design/shaders-react` | ^0.0.82 | Apache-2.0 | Testado como fundo ambiental (shader WebGL) | **Instalado mas não adotado** — custo de CPU alto em contexto real (ver `TESTS.md`); mantido só para a ferramenta `shader-teste` |
| `framer-motion` | ^14.7.1 | — | Já dependência de produção | Reutilizado |
| `recharts` | ^3.10.1 | — | Já dependência de produção (gráfico de barras do dashboard real) | Reutilizado em `GlassSparkline` |
| `lucide-react` | ^1.64.0 | — | Já dependência de produção | Reutilizado |

Nenhuma dependência redundante foi instalada (shadcn/ui e Tremor foram avaliados e rejeitados por exigirem Tailwind, que o projeto não usa — ver `app/design-lab/CONHECIMENTO.md`).

## Reuso cruzado com produção (resumo)

- `usarPodeHover()` (`app/_ui/usar-pode-hover.ts`) — importado diretamente, não reimplementado.
- Padrão de hover de `CardBento` (`app/_ui/card-bento.tsx`) — mesmos valores de spring/deslocamento.
- Padrão de overlay-fecha-ao-clicar-fora de `app/_ui/barra-lateral.tsx` (menu de conta).
- Estrutura do assistente de IA real (`app/assistente/chat.tsx`) — mesmas 2 sugestões, mesmo texto de ajuda, mesma lógica de bolhas de mensagem (sem chamada de rede no protótipo).
- Classe `.crm-cartao-vidro-claro` (`app/globals.css`) — única peça do sistema experimental que **já está em produção**, via a tela de login (não importa os componentes React do `/design-lab`, reaproveita a classe CSS que já existia).
