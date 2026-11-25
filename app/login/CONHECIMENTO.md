# Authentication Blueprint — tela de login

> Documento vivo. Registra o padrão visual da tela de login pra reuso em
> telas de autenticação futuras (recuperação de senha, convite, etc.) e
> pra alimentar a skill `premium-liquid-ui`/Skill Studio quando existirem
> de verdade neste ambiente (ver `app/design-lab/CONHECIMENTO.md` pra mais
> contexto sobre essa limitação).

## Referência

Mockup aprovado pelo Caio (sessão de 2026-11-26): fundo azul perolado com
esferas 3D, janela de vidro translúcida assimétrica, bordas ópticas
iluminadas, composição desktop (identidade à esquerda, formulário à
direita) / mobile (formulário centralizado).

## Decisão de arquitetura: CSS/SVG, não WebGL

O laboratório (`/design-lab`) tinha acabado de medir que `@paper-design/
shaders-react` (WebGL) fica caro quando combinado com qualquer animação
contínua na mesma tela — e esta tela TEM animação contínua (esferas
flutuando). Em vez de repetir o erro, as esferas aqui são CSS puro
(`radial-gradient` + `box-shadow`, flutuação via `framer-motion` animando
só `transform: translateY`, que é WAAPI/GPU-acelerado). Medido: ~0,1% de
1 núcleo com as esferas flutuando — nem de longe o problema do shader.
Ver `app/design-lab/CONHECIMENTO.md` pro histórico completo dessa decisão.

## Componentes reutilizados (não reinventados)

- **Janela de vidro**: classe `.crm-cartao-vidro-claro` (`app/globals.css`)
  — a MESMA classe já aprovada e em produção nos cards do Painel, com o
  fallback de `prefers-reduced-transparency` já embutido. Não usa o
  sistema experimental de `app/design-lab/_glass` (laboratório, não é
  produto).
- **Tokens**: `cor`, `raio` de `lib/theme.ts` — mesma fonte de verdade do
  resto do sistema.
- **Ícones**: `lucide-react` (já dependência) — `BarChart3` (marca),
  `Eye`/`EyeOff` (mostrar/ocultar senha).
- **Motion**: `framer-motion` (já dependência) — entrada (fade + leve
  deslocamento, com `delay` escalonado entre identidade e janela),
  flutuação das esferas, pulso do botão ao clicar. Tudo com
  `useReducedMotion()` — zero animação se o usuário pedir.

## O que NÃO mudou (autenticação preservada)

`app/login/page.tsx`: `handleSubmit` (`supabase.auth.signInWithPassword`),
`entrarComGoogle` (`supabase.auth.signInWithOAuth`), os estados
`email`/`password`/`erro`/`carregando`/`carregandoGoogle`, o redirect pro
`/dashboard`, a leitura de `?erro=google` da URL — tudo idêntico ao
arquivo anterior. Única adição de estado: `mostrarSenha` (puramente
visual, alterna `type` do campo entre `password`/`text`, não toca em
lógica de autenticação). Nenhum cadastro público foi criado; nenhuma
regra de acesso foi alterada.

## Acessibilidade (verificada, não presumida)

- Contraste medido de verdade (pixel renderizado + cor computada, fórmula
  WCAG), não só "cor combina com cor": todos os textos passam 4.5:1 — o
  mais apertado foi "Ambiente de acesso restrito" a 4,52:1 (no limite,
  registrado aqui pra se precisar reforçar depois).
- `Tab` alcança o campo de e-mail, senha, botão de mostrar/ocultar,
  Google e submit — nenhum elemento interativo é `<div>` decorativo.
- Botão de mostrar/ocultar senha: 40×40px (alvo de toque — o input em si
  já tem ~44px de altura).
- Nenhum `outline: none` foi usado — o anel de foco padrão do navegador
  continua visível ao navegar por teclado.

## Teste funcional realizado (e o que NÃO foi testado)

Via Playwright: preenchimento dos campos, toggle de senha (confirma
`type` muda de `password` pra `text`), submit (confirma que o fluxo de
erro — "E-mail ou senha inválidos" — aparece corretamente quando o
Supabase não responde, sem quebrar a tela), responsivo desktop/mobile,
zero erro de console (a única mensagem de rede é a tentativa de alcançar
o Supabase de mentira deste ambiente, esperada).

**Não testado**: o fluxo real de autenticação (login de verdade com
Supabase + Google OAuth reais) — este ambiente não tem credenciais
reais. Só Chromium headless via Playwright — sem evidência de Safari/
Firefox/dispositivo real.
