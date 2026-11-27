# Testes realizados — Liquid Glass / CRM Premium

> Todos os testes abaixo foram feitos com Playwright contra **build de produção** (`npm run build` + `npm run start`), não `npm run dev` — medição em dev mostrou-se enganosa por overhead de compilação na primeira navegação (0%, 40,7%, 1,5% em três execuções do mesmo teste). **Homologação final**: testado em Chromium, Firefox e WebKit (headless) — os três motores de renderização de desktop que o Playwright suporta. Segue sem teste em dispositivo físico (iOS/Android reais usam variações desses mesmos motores, não exatamente os binários de desktop testados aqui) — limitação registrada, não escondida.

## Dados simulados vs. funcionalidade real

**Importante**: o protótipo inteiro (`/design-lab`) usa **dados fictícios** (contratos, KPIs, andamentos, resposta do assistente de IA) — nada vem de banco de dados ou API real. A única exceção é a **tela de login** (`app/login/page.tsx`), que é produção de verdade e usa autenticação real (Supabase + Google OAuth), não simulada.

| Funcionalidade | Simulada (protótipo) | Real |
|---|---|---|
| KPIs, gráficos, tabelas, andamentos, contratos | ✅ dados fictícios fixos no código | — |
| Filtro "Próximos N dias" (Entregas previstas) | — | ✅ filtra de verdade a lista fictícia |
| Filtro Todos/Ocorrências (Andamentos) | — | ✅ filtra de verdade a lista fictícia |
| Resposta do assistente de IA | ✅ texto fictício "digitado" via `setTimeout` (sem chamada de rede) | — |
| Botão "Exportar PDF" | ✅ decorativo (sem ação) | — |
| Autenticação (login) | — | ✅ Supabase `signInWithPassword`/`signInWithOAuth` reais, preservados sem alteração |
| Tema claro/escuro, menu de conta, navegação por abas | — | ✅ comportamento real de UI (estado React de verdade, não decoração) |

## Testes funcionais

Executados incrementalmente a cada passo (1-9) e revalidados juntos na auditoria final (passo 10):

- Troca de tema claro/escuro em todas as telas do protótipo.
- Abas do dashboard e da janela de contrato (bug real encontrado e corrigido na fase 7: abas trocavam o seletor mas não o conteúdo).
- Filtro "Próximos N dias": clique real confirmado via Playwright — o item "Material cirúrgico" (28 dias) desaparece ao trocar para 7 dias e volta em 30 (não apenas "o popover abre").
- Filtro Todos/Ocorrências: confirmado que os 3 andamentos comuns desaparecem e os 2 de ocorrência permanecem ao filtrar.
- Menu de conta (sidebar): abre, mostra "Sair", fecha ao clicar fora e ao clicar na opção.
- Painel do assistente de IA: abre pelo clique E pelo teclado (`Tab` + `Enter`); clique em sugestão gera a bolha do usuário e a resposta simulada; pergunta livre digitada + `Enter` funciona; fecha ao clicar fora.
- Bottom sheet mobile (janela de contrato): abas, filtro e tags do passo 6 continuam funcionando dentro do sheet; alternância de tema funciona.
- Dock mobile: os 3 itens continuam clicáveis após ganharem `whileTap`.
- Grupo "Cadastros" da sidebar: expande/colapsa corretamente (estado inicial aberto).

**Zero erro de console** em todas as combinações testadas (ver matriz de telas abaixo).

## Matriz de telas testadas (passo 10 — auditoria final; expandida na homologação final)

| Tela | Desktop | Tablet | Mobile | Claro | Escuro |
|---|---|---|---|---|---|
| Dashboard (`/design-lab`) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Janela de contrato (`/design-lab/janela`) | ✅ | ✅ | ✅ (sheet) | ✅ | ✅ |
| Login (produção) | ✅ | ✅ | ✅ | ✅ | — (sistema de login é só claro, por mockup aprovado) |

Screenshots em `screenshots/`, prefixadas pelo motor (`chromium-`/`firefox-`/`webkit-`), desktop 1280×900, tablet 768×1024, mobile 390×844, `-claro`/`-escuro`.

### Testado em 3 motores de renderização (homologação final)

| Motor | Instalação | Resultado |
|---|---|---|
| Chromium | Pré-instalado neste ambiente | ✅ 9/9 combinações (3 telas × 3 larguras), zero erro de console, zero overflow horizontal |
| Firefox | Instalado nesta rodada (`playwright install firefox`) | ✅ 9/9 combinações, mesmos resultados |
| WebKit | Instalado nesta rodada (`playwright install webkit` + `install-deps webkit` para as bibliotecas de sistema que faltavam) | ✅ 9/9 combinações, mesmos resultados |

27 combinações no total (3 motores × 3 telas × 3 larguras), cada uma com teste de tema claro/escuro onde aplicável — **zero erro de console e zero overflow horizontal em todas elas** (`document.documentElement.scrollWidth` comparado contra `clientWidth`, não inspeção visual).

### Gap de tablet — corrigido nesta rodada

**Dashboard em largura de tablet (768-1023px) estourava horizontalmente** (achado do passo 10, corrigido agora). Causa: breakpoint binário (`window.innerWidth >= 768` = modo desktop, com sidebar fixa + grade de 5/3 colunas), sem terceiro estado para tablet — em 768px exatos a grade ficava larga demais, cortando conteúdo à direita.

**Correção**: terceiro estado (`mobile` <768px / `tablet` 768-1023px / `desktop` ≥1024px) em `app/design-lab/page.tsx`. Tablet usa a mesma navegação por dock do mobile (sidebar fixa não cabe), grades intermediárias (3 colunas de KPI, 2 de bento) e scroll normal — só desktop mantém sidebar + grade de 5/3 colunas + altura travada em 100vh. Confirmado sem overflow em `screenshots/{chromium,firefox,webkit}-dashboard-tablet-{claro,escuro}.png`.

A **janela de contrato nunca teve esse problema** (já é centralizada com `maxWidth`, só encolhe) e o **login também não** (a coluna de identidade já esconde abaixo de 900px) — confirmado nos screenshots correspondentes.

## Desempenho (CDP `Performance.getMetrics`, `TaskDuration` real — não estimativa)

| Cenário | Custo de CPU (3s parado, 1 núcleo) |
|---|---|
| SVG atual (`AmbientBackground`), fundo ambiental isolado | ~0% |
| `MeshGradient` (shader **animado**, `@paper-design/shaders-react`) | **~104%, constante** |
| `StaticMeshGradient` (shader sem animação, isolado) | ~0% |
| Dashboard completo, fundo SVG (antes das esferas 3D) | ~1,8-2,2% |
| Dashboard completo, fundo `StaticMeshGradient` (testado e **revertido**) | **~55-60%, consistente em 3/3 execuções** |
| Dashboard completo, fundo SVG + esferas 3D CSS (passo 3, adotado) | ~2,0-2,4% |
| **Dashboard completo, após todos os passos 5-9** (sparklines, popovers, painel de IA, toda a navegação) | **~2,0-2,3%** — sem acúmulo de custo |
| Dashboard com painel de IA aberto | ~2,0% — mesma faixa |
| Janela de contrato mobile (sheet, sem animação contínua decorativa) | ~0,09% |

**Achado central (o mais importante do processo todo)**: o custo alto do `StaticMeshGradient` em contexto real não vem do shader isolado — vem de **WebGL + qualquer animação contínua rodando na mesma tela** (o botão de IA e o sino já tinham glow/pulso pulsantes). Um `GlassCard` isolado com a mesma animação de fundo não reproduziu o custo sozinho. Regra resultante, aplicada e confirmada: **fundo ambiental deve ser sempre CSS/SVG, nunca WebGL/shader, em qualquer tela com animação contínua** — medir cada tela isoladamente nunca é suficiente, é preciso medir no contexto completo antes de declarar "sem custo".

**Limitação da medição**: Chromium headless deste ambiente não tem GPU real (`SwiftShader`, renderização por software via CPU) — os números do shader animado tendem a ser pessimistas comparados a hardware real com GPU. Não testado em hardware real.

### Avaliação de remoção do shader não adotado (homologação final)

`@paper-design/shaders-react` segue instalado, mas não adotado como fundo padrão (decisão original, confirmada acima). Avaliado nesta rodada se valia a pena desinstalar:

- **Disco**: 1,8MB em `node_modules/@paper-design` — irrelevante.
- **Bundle**: a única rota que o importa é `/design-lab/shader-teste` (`First Load JS` de ~254KB, na mesma faixa de `/design-lab/janela`, ~247KB) — **nenhuma outra rota paga esse custo**, código-dividido por rota pelo Next.js.
- **Valor como ferramenta**: foi o instrumento que produziu o achado mais importante do processo ("WebGL + animação contínua = caro") e permite reavaliar o fundo ambiental no futuro (ex.: em hardware com GPU real) sem precisar reinstalar e reconstruir a ferramenta de comparação do zero.

**Decisão: manter instalado.** Não há ganho real em remover (custo já é zero fora da única rota que o usa) e há custo real em remover (perde a ferramenta de medição validada).

### Sparkline: SVG vs. Recharts (homologação final)

Comparação entre a versão original (`GlassSparkline`, `recharts`) e a nova (`GlassSparklineSVG`, sem dependência), medida com build de produção:

| Critério | `recharts` (removido) | SVG puro (adotado) |
|---|---|---|
| First Load JS do grupo `/design-lab` | 347KB (`/design-lab`) | **255KB** (-92KB) |
| CPU (3s parado) | ~0% (sem animação) | ~0% (sem animação) — empate |
| Fidelidade visual | Curva suavizada (`type="monotone"`, Bézier) | Path reto entre pontos — levemente mais angular, mas a diferença é imperceptível num sparkline de ~100×28px (confirmado visualmente em 3 motores) |

**Decisão: adotada a versão SVG**, a versão `recharts` foi removida do protótipo (não ficou como código morto/duplicidade). `recharts` continua em produção normalmente (gráfico de barras do dashboard real), sem relação com esta troca.

## Acessibilidade

- **Contraste**: medido via pixel renderizado/cor computada + fórmula WCAG (não "parece combinar") — todos os textos passam 4,5:1+; remedido na homologação final (rótulo do dashboard e rodapé do login): 5,34:1 em ambos, sem regressão.
- **Navegação por teclado**: todos os itens de navegação (sidebar, dock, abas) são `<button>` reais com alvo de toque mínimo de 44×44px (WCAG 2.5.5) — nenhum `<div>` decorativo disfarçado de controle. `outline` padrão do navegador nunca removido. Remedido na homologação final: os 4 itens do dock mobile têm 44px de altura e largura ≥44px.
- **Focus trap no painel de IA — corrigido na homologação final**: antes, `Tab` conseguia sair do painel pro resto da página e `Escape` não fechava nada (pendência documentada no passo 10). Agora: `Tab`/`Shift+Tab` cicla só dentro do painel (testado com 8 `Tab` seguidos — todos permaneceram dentro do `role="dialog"`), `Escape` fecha, e o foco retorna pro botão que abriu ao fechar (testado nos dois caminhos: `Escape` e clique no overlay).
- **`prefers-reduced-motion`**: testado de verdade (não só código revisado) — painel de IA abre, sugestão funciona, resposta simulada aparece, tudo sem depender de nenhuma animação quando a preferência está ativa.
- **`prefers-reduced-transparency`** e **`prefers-contrast: more`**: aplicados em todas as superfícies de vidro via `usePreferenciaMidia` — queda para quase opaco sem `backdrop-filter`, e borda reforçada, respectivamente.

## Ferramentas de teste usadas

- Playwright — Chromium (pré-instalado), Firefox e WebKit (instalados na homologação final via `playwright install firefox webkit`; WebKit precisou também de `playwright install-deps webkit` para bibliotecas de sistema ausentes no ambiente) — para funcional, visual, overflow e acessibilidade.
- CDP `Performance.getMetrics` (`TaskDuration`) para CPU real, não estimada — Chromium apenas (Firefox/WebKit não expõem essa API via CDP).
- `document.documentElement.scrollWidth` vs. `clientWidth` para detecção de overflow horizontal real, não inspeção visual.
- `getComputedStyle` + fórmula de contraste relativo WCAG para verificação de contraste real.
- `npx tsc --noEmit` e `npm run build` (com variáveis de ambiente Supabase placeholder) antes de cada commit, em todas as 10 etapas e na homologação final.
