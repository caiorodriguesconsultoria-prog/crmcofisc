# Regras do design novo (grade bento/dashboard)

Adaptação do guia "CRM COFISC — Padronização Visual (Dashboard)" (Caio, 28/10/2026)
ao projeto real. Duas diferenças do guia original, decididas com o Caio antes da Etapa 1:

- **Sem Tailwind, sem `src/components/ui/`.** O projeto é Next.js (App Router), não Vite,
  e todo o estilo já existente é inline, orientado pelos tokens de `lib/theme.ts`
  (`cor`, `card`, `botaoPrimario` etc.), com os componentes compartilhados em `app/_ui/`.
  Introduzir Tailwind agora reescreveria o app inteiro sem ganho real — `lib/theme.ts`
  já cumpre o papel de fonte única dos tokens. Os componentes novos deste design seguem
  o mesmo padrão (estilo inline + `lib/theme.ts`), em `app/_ui/`. `tokens.css` nesta pasta
  existe como referência/documentação dos valores — a fonte da verdade é `lib/theme.ts`.
- **Acento: azul (já aprovado) + laranja quente só no card de destaque único**, não o
  "quase preto" do guia original. Comparando com o site de referência que o Caio mandou
  (Moorly, code.xr), o acento principal real de lá também é um azul-petróleo — bate com
  o azul que já usamos (`cor.destaque`, `#2F5FDB`). O laranja vibrante da referência
  (`cor.destaqueQuente`) fica só dentro do card escuro de destaque (ação do dia), nunca
  em mais de um lugar por tela, e nunca em indicador de urgência (isso são as três cores
  de urgência de `lib/theme.ts`, que já existem e não mudam).

## Regras que valem pra tudo

- Cores sólidas, sem degradê novo, sem sombra pesada, sem desfoque de vidro. (Gradientes
  já existentes — `botaoPrimario`, `tituloDestaque` — não foram tocados nesta etapa; são
  decisão anterior, aprovada, fora do escopo da Etapa 1.)
- Sem emojis. Sem travessão nem hífen no meio de frases nos textos da interface.
- Urgência é sempre ponto de 8px mais o texto do prazo na cor do estado (`IndicadorUrgencia`),
  nunca só a cor, nunca pílula preenchida.
- Tags (`TagRotulo`) com contorno fino e raio de 8px, nunca na cor de urgência nem no
  acento quente.
- Animar só `transform` e `opacity`, nunca `transition: all`. Curva `movimento.ease`
  (`cubic-bezier(0.22, 1, 0.36, 1)`), durações de `movimento` em `lib/theme.ts`.
- Respeitar `prefers-reduced-motion` — ver `app/globals.css`.
- Hover só dentro de `@media (hover: hover) and (pointer: fine)` (evita hover "preso"
  depois de um toque em celular — ver skill `mobile-native`).
- Celular: altura com `100dvh` (não `100vh`), campos com 16px (evita zoom automático no
  iOS), áreas de toque de pelo menos 44px, `env(safe-area-inset-*)` em barra fixa.
- Cada componente é criado uma vez em `app/_ui/` e reaproveitado — nunca recriar um
  componente parecido por tela.
- Modelo de dados, RLS e variáveis de ambiente não mudam em nenhuma etapa deste design.
- **Nunca excluir ou enfraquecer** as regras de compartilhamento de informação dentro do
  sistema (RLS, telas de permissão) nem os botões de anexar documento (PDF/Excel/foto)
  acrescentados recentemente em Pauta de Distribuição, Dados de Entrega, Cronograma e
  Quadro Resumitivo — pedido explícito do Caio antes de começar este redesenho.

## Componentes criados na Etapa 1 (`app/_ui/`)

| Componente | Arquivo | Equivalente ao guia |
| --- | --- | --- |
| `CardBento` | `card-bento.tsx` | Card base |
| `Kpi` | `kpi.tsx` | KPI |
| `IndicadorUrgencia` | `indicador-urgencia.tsx` | Indicador de urgência |
| `TagRotulo` | `tag-rotulo.tsx` | Rótulo de tag |
| `CampoComCopiar` | já existe como `LinhaChave`/`BotaoCopiar` em `app/_ui/campo.tsx` — reaproveitado, não duplicado |

Tela de exemplo (normal, hover, pressionado, carregando): `/exemplo`.
