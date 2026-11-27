# Testes realizados — Liquid Glass / CRM Premium

> Todos os testes abaixo foram feitos com Playwright (Chromium headless) contra **build de produção** (`npm run build` + `npm run start`), não `npm run dev` — medição em dev mostrou-se enganosa por overhead de compilação na primeira navegação (0%, 40,7%, 1,5% em três execuções do mesmo teste). Nenhum teste foi feito em Safari/WebKit, Firefox, ou dispositivo real — limitação registrada, não escondida.

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

## Matriz de telas testadas (passo 10 — auditoria final)

| Tela | Desktop | Tablet | Mobile | Claro | Escuro |
|---|---|---|---|---|---|
| Dashboard (`/design-lab`) | ✅ | ✅ (ver gap abaixo) | ✅ | ✅ | ✅ |
| Janela de contrato (`/design-lab/janela`) | ✅ | ✅ | ✅ (sheet) | ✅ | ✅ |
| Login (produção) | ✅ | ✅ | ✅ | ✅ | — (sistema de login é só claro, por mockup aprovado) |

Screenshots em `screenshots/` (desktop 1280×900, tablet 768×1024, mobile 390×844; `-claro`/`-escuro`).

### Falha/gap encontrado nesta rodada (não corrigido — fora do escopo do plano de 10 passos)

**Dashboard em largura de tablet (768px) estoura horizontalmente.** O breakpoint do dashboard é binário (`window.innerWidth >= 768` = modo desktop, com sidebar fixa + grade de 5/3 colunas), sem um terceiro estado intermediário para tablet. Em 768px exatos, a grade de cards fica larga demais para a viewport, cortando conteúdo à direita (ver `screenshots/dashboard-tablet-claro.png` — o card "Entregas previstas" tem o rótulo do filtro cortado, e os cards "Cobertura de férias"/"Insights da IA" ficam parcialmente fora da tela).

A **janela de contrato não tem esse problema** em tablet — ela já é centralizada com `maxWidth`, então apenas encolhe graciosamente (ver `screenshots/janela-tablet-claro.png`). O **login também não tem** — a coluna de identidade já esconde abaixo de 900px (CSS), então tablet cai no layout mobile centralizado (`screenshots/login-tablet-claro.png`).

Registrado em `MIGRATION.md` como item a resolver antes de migrar o dashboard para produção.

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

**Custo de bundle**: a rota `/design-lab` cresceu de ~252KB para ~345KB de First Load JS ao adicionar `GlassSparkline` (`recharts`) — o Next.js separa bundle por rota, então "já é dependência do projeto" não significa "grátis nesta rota especificamente".

## Acessibilidade

- **Contraste**: medido via pixel renderizado + `getComputedStyle` + fórmula WCAG (não "parece combinar") — todos os textos passam 4,5:1+; o mais apertado foi "Ambiente de acesso restrito" na tela de login, a 4,52:1 (no limite, registrado para reforço futuro se necessário).
- **Navegação por teclado**: todos os itens de navegação (sidebar, dock, abas) são `<button>` reais com alvo de toque mínimo de 44×44px (WCAG 2.5.5) — nenhum `<div>` decorativo disfarçado de controle. `outline` padrão do navegador nunca removido.
- **`prefers-reduced-motion`**: testado de verdade (não só código revisado) — painel de IA abre, sugestão funciona, resposta simulada aparece, tudo sem depender de nenhuma animação quando a preferência está ativa.
- **`prefers-reduced-transparency`** e **`prefers-contrast: more`**: aplicados em todas as superfícies de vidro via `usePreferenciaMidia` — queda para quase opaco sem `backdrop-filter`, e borda reforçada, respectivamente.
- **Gap conhecido, documentado e não corrigido**: o painel do assistente de IA não tem *focus trap* — `Tab` alcança o botão "Fechar" logo após abrir (ordem de DOM razoável), mas nada impede que `Tab` continue para o resto da página por trás, e `Escape` não fecha o painel. Pendência explícita para uma futura promoção a produto.

## Ferramentas de teste usadas

- Playwright (Chromium) para funcional, visual e acessibilidade.
- CDP `Performance.getMetrics` (`TaskDuration`) para CPU real, não estimada.
- `sharp` (Node) para amostragem de pixel real em verificação de contraste.
- `npx tsc --noEmit` e `npm run build` (com variáveis de ambiente Supabase placeholder) antes de cada commit, em todas as 10 etapas.
