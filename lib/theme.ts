export const cor = {
  // Azul bem clarinho, no mesmo nível de claridade do bege antigo (#F6F3F0)
  // — mesma "temperatura" visual, só troca o matiz quente pelo frio.
  fundo: "#EFF3FB",
  branco: "#FFFFFF",
  texto: "#201F1D",
  textoSecundario: "#605D5D",
  // Era #7D7979 (4,3:1 contra branco — abaixo do mínimo de 4,5:1 pra texto
  // pequeno/normal da WCAG AA) — essa é a cor usada em quase todo rótulo
  // pequeno maiúsculo do sistema (146 usos em 48 arquivos), então era
  // exatamente a causa da sensação de fonte "apagada" que o Caio reportou
  // repetidas vezes. #6E6A6A mede 5,3:1, passa confortavelmente, e ainda
  // lê como um cinza "terciário" claramente mais claro que textoSecundario
  // (6,5:1) e texto (quase preto).
  textoTerciario: "#6E6A6A",
  borda: "rgba(32,31,29,.07)",
  // "destaque" é o acento de marca (links, pílulas ativas, botão copiar,
  // rótulos) — centralizado aqui pra virar azul em todo o app de uma vez.
  destaque: "#2F5FDB",
  destaqueFundo: "rgba(47,95,219,.10)",
  azul: "#2F5FDB",
  azulEscuro: "#1B3FA6",
  azulFundo: "rgba(47,95,219,.10)",
  positivo: "#7E9B7E",
  positivoFundo: "rgba(126,155,126,.18)",
  verdeEscuro: "#2F6B4F",
  verdeEscuroFundo: "rgba(47,107,79,.14)",
  atencao: "#C08A3E",
  atencaoFundo: "rgba(192,138,62,.14)",
  amarelo: "#B8972E",
  amareloFundo: "rgba(184,151,46,.16)",
  laranja: "#C8651F",
  laranjaFundo: "rgba(200,101,31,.15)",
  urgente: "#B0655C",
  urgenteFundo: "rgba(176,101,92,.14)",
  vermelhoEscuro: "#7A2E2E",
  vermelhoEscuroFundo: "rgba(122,46,46,.15)",
  // Trocado de cinza quente (#2D2B2B) pra azul-marinho — paleta que o Caio
  // escolheu pra reforçar "azul sobre azul" nos elementos escuros do
  // redesenho novo (card de destaque, cápsula ativa da BarraTopo), em vez de
  // misturar um neutro quente com o acento azul.
  escuro: "#021024",
  // Azul bem claro da mesma paleta — fundo de hover/destaque leve (ex.:
  // coluna do Kanban recebendo o arraste), mais vivo que `destaqueFundo`.
  azulClaroDestaque: "#C1E8FF",
  // Acento quente — só decorativo (card de destaque único no estilo
  // bento/dashboard), nunca usado pra indicar urgência/status. Ver
  // design-system/REGRAS.md.
  destaqueQuente: "#E2883A",
  destaqueQuenteFundo: "rgba(226,136,58,.16)",
  // Versões escurecidas de positivo/atencao/urgente, só pra TEXTO pequeno
  // sobre fundo claro (Etapa 6 do redesenho — revisão de contraste). As
  // cores "cheias" de cima (positivo/atencao/urgente) têm contraste de
  // 3,0 a 4,3:1 contra branco — passam no mínimo de 3:1 pra elementos
  // gráficos (ponto do IndicadorUrgencia), mas ficam abaixo dos 4,5:1
  // exigidos pra texto pequeno legível. Essas três versões passam de
  // 4,9:1. Usadas só nos componentes novos do redesenho por enquanto —
  // o resto do sistema já usava as cores cheias como texto antes disso
  // existir, e recolorir tudo de uma vez é maior que o escopo desta etapa.
  positivoTexto: "#5A7355",
  atencaoTexto: "#8A6420",
  urgenteTexto: "#8A4B43",
};

// Cantos e movimento do design novo (grade bento/dashboard) — ver
// design-system/REGRAS.md e design-system/tokens.css (mesmos valores, em
// CSS). Os componentes em app/_ui/ usam estes; telas antigas continuam
// com os raios que já tinham (18/22px em `card`/`.crm-painel-alto` etc.),
// não foram tocadas na Etapa 1.
export const raio = {
  campo: 14,
  tag: 8,
  // Subido de 16 pra 20 — widgets pequenos (KPI, Agenda de hoje, Divisão
  // por coordenação) pedem a curva mais generosa do visual "ícone de app"
  // (skill visual-apps-apple-ios26); 16px num card de ~120-220px de largura
  // ainda lia como "quadrado com canto cortado".
  cardPequeno: 20,
  card: 22,
  painel: 24,
  pilula: 999,
};

export const movimento = {
  ease: "cubic-bezier(0.22, 1, 0.36, 1)",
  hover: 0.15,
  fade: 0.2,
  janela: 0.25,
  entrada: 0.3,
  escalonado: 0.04,
  // Caiu de 600ms pra 300ms na Etapa 6 (revisão de movimento) — mais rápido
  // sem perder a sensação de contagem, e menos tempo com número "errado"
  // na tela antes de chegar no valor final.
  contagemKpi: 0.3,
  // Física de mola (spring), não duração fixa — pro feedback de toque em
  // elementos interativos (CardBento, pílulas): um leve "passar do ponto e
  // voltar" que lê como objeto físico reagindo, em vez de uma animação
  // calculada. Reservado pra hover/press (gestos); contagem de número e
  // entrada de card continuam com duração fixa, que é o certo pra textos
  // e números — spring faria o número oscilar antes de assentar.
  springHover: { type: "spring" as const, stiffness: 400, damping: 30 },
  springPress: { type: "spring" as const, stiffness: 500, damping: 25 },
};

// Paleta viva pra gráficos categóricos (pizza de etapas, por exemplo) —
// pedido do Caio depois de ver o site de referência de novo ("mais cores,
// algo mais vivo"): tons extraídos dos --c-hull/--c-cargo/--c-marina/etc.
// do site (oklch convertido pra hex), mais saturados que o resto da
// paleta do sistema. Eventos continuam usando `corEvento()` (cor própria
// de cada tag, já usada em todo o app) — essa aqui é só pra quando não
// existe uma cor própria por item, como nas etapas do Kanban.
export const PALETA_VIVA = ["#3578B8", "#D19936", "#2D9570", "#C66846", "#7D9849", "#C66177", "#8A5CB8", "#3A7CA5"];

// Subida (era "0 1px 2px rgba(32,31,29,.035)", quase imperceptível) —
// pedido do Caio pras janelas "parecerem flutuar" sobre o fundo aurora.
export const sombraCard = "0 1px 2px rgba(32,31,29,.06), 0 18px 40px rgba(32,31,29,.14)";
export const sombraFlutuante = "0 1px 2px rgba(0,0,0,.07), 0 6px 16px rgba(0,0,0,.05)";

// Vidro translúcido (mesmo material de .crm-cartao-vidro-claro em
// globals.css) aplicado direto aqui — pedido do Caio pra cobrir TODO
// card do sistema de uma vez, já que a maioria ainda usa este objeto
// via `style={{ ...card }}` em vez do componente CardBento. Opacidade
// calibrada entre dois extremos que o Caio já reportou: alta demais
// (.9) virava quase opaco e perdia o efeito "vidro"; baixa demais (.72)
// ficava parecida demais com a cor do fundo. .82 é o meio-termo. Blur/
// saturate na faixa que a Apple usa nos materiais (skill apple-design) —
// uma rodada anterior forçou mais (30px/200%) achando que resolvia o
// "vidro" não ficar perceptível, só piorou a legibilidade do texto.
// Limitação conhecida: por ser um objeto de inline style (não uma
// classe), não tem o fallback de prefers-reduced-transparency que
// .crm-cartao-vidro-claro tem — documentado, não resolvido nesta rodada.
// Correção (vídeo do Caio): esse `card` também é usado dentro de telas com
// fundo BRANCO OPACO (detalhe do contrato em tela cheia e no modal —
// .crm-painel-alto/.crm-modal-painel, que de propósito continuam sólidas,
// não viram vidro — ver o motivo da janela do modal continuar opaca
// abaixo). Vidro translúcido sobre branco sólido não tem nada atrás pra
// borrar — vira, na prática, quase indistinguível do fundo (a borda de
// 8% de opacidade ficava invisível), e isso lia como "os cards sumiram,
// as informações ficam soltas". Border e opacidade subidos um pouco pra
// aguentar os dois cenários (aurora por trás OU branco sólido por trás)
// sem depender de qual é qual.
export const card: React.CSSProperties = {
  background: "rgba(255,255,255,.88)",
  backdropFilter: "blur(22px) saturate(180%)",
  WebkitBackdropFilter: "blur(22px) saturate(180%)",
  borderRadius: 18,
  padding: "18px 20px",
  border: "1px solid rgba(32,31,29,.12)",
  boxShadow: sombraCard,
};

// Escala de elevação (CRM Premium, Etapa 1 — "hierarquia de profundidade:
// fundo → cards acetinados → navegação → janelas → popovers/modais →
// notificações", seção 3.1 do CRM_PREMIUM_SPEC.md). Centralizado aqui pra
// todo componente novo de vidro/janela usar o mesmo z-index em vez de cada
// um inventar o seu — é exatamente o tipo de conflito (chat flutuante por
// baixo de um modal, por exemplo) que a especificação pede pra evitar.
export const elevacao = {
  fundo: 0,
  card: 10,
  navegacao: 20,
  janela: 30,
  popover: 40,
  notificacao: 50,
};

// Paleta escura (CRM Premium, Etapa 1 — tema escuro com preferência
// persistida, seção 3.2). Reaproveita o azul-marinho que já é a cor
// "escura" da marca (cor.escuro, usado no card de destaque e na cápsula
// ativa da BarraTopo) como base do fundo, em vez de um neutro cinza
// genérico — mantém "azul sobre azul" em claro e escuro. Usada por agora
// só na prova visual de /exemplo-liquid-glass (Etapa 1); aplicar no app
// inteiro é trabalho de etapa futura, com aprovação própria.
export const corEscuro = {
  fundo: "#060B16",
  superficie: "#0E1526",
  texto: "#EDEFF4",
  textoSecundario: "#9BA3B4",
  textoTerciario: "#7E8698",
  borda: "rgba(255,255,255,.09)",
  destaque: "#5B8CFF",
  destaqueFundo: "rgba(91,140,255,.16)",
};

// Presets de material "vidro" por densidade de uso (CRM Premium, Etapa 1 —
// seção 3.1: "desktop ~50%, mobile ~70%, esses percentuais não são
// opacidade CSS"). Cada preset é a combinação calibrada de blur + saturação
// + opacidade de fundo que LÊ como essa intensidade — não um valor de
// opacidade isolado. `padrao` é o material já em produção (CardBento
// vidroClaro / .crm-cartao-vidro-claro); `intenso` é a variante mais
// "evidente" pedida pro mobile, usada por enquanto só na prova visual.
export const vidro = {
  padrao: { blur: 22, saturate: 180, alphaFundo: 0.82 },
  intenso: { blur: 28, saturate: 190, alphaFundo: 0.74 },
};

// Passo 2 do "CRM Premium" (consolidar o Design System proprietário):
// antes desses nomes, os overrides de opacidade do /design-lab viviam como
// números soltos (`alphaFundo={0.7}`, `{0.5}`) repetidos em vários
// arquivos, cada um com seu próprio comentário explicando "por que 70%" —
// fonte única agora. Valores exatamente os já calibrados/aprovados pelo
// Caio (ver app/design-lab/CONHECIMENTO.md e design-system/LIQUID_GLASS.md
// pro histórico de decisão); nenhuma mudança visual neste refactor.
export const vidroNivel = {
  /** Janela de contrato/modal — superfície decorativa, mais vidro (mais
   * transparente) porque não carrega texto denso linha a linha sozinha. */
  janela: 0.5,
  /** Card/KPI de dashboard — mais sólido que a janela, carrega número e
   * texto curto que precisa ficar legível mesmo com o fundo variando. */
  cartao: 0.7,
  /** Sidebar/popover — sem override, usa o blur/saturate padrão também
   * pra opacidade (preset `padrao` já definido acima). */
  navegacao: vidro.padrao.alphaFundo,
  /** Dock mobile/sheet — sem override, usa o preset `intenso`. */
  dock: vidro.intenso.alphaFundo,
};

export const botaoPrimario: React.CSSProperties = {
  // Cor plana — gradiente em botão é um dos sinais mais comuns de "cara de
  // IA" (ver auditoria de design, rodada 2); cor sólida com peso tipográfico
  // já comunica hierarquia sem precisar de efeito.
  background: cor.azul,
  color: "#fff",
  fontSize: 13,
  fontWeight: 700,
  padding: "10px 18px",
  borderRadius: 22,
  border: "none",
  cursor: "pointer",
};

export const pill: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  borderRadius: 20,
  padding: "4px 10px",
  display: "inline-block",
};

// Lista de cores pra distinguir tags de evento entre si (Kanban, Painel do
// processo, barra lateral) — ordem estável: a mesma tag sempre cai na mesma
// cor, calculada a partir do id (ver corEvento em lib/cores-evento.ts).
export const PALETA_EVENTOS = [
  { texto: "#2F5FDB", fundo: "rgba(47,95,219,.10)" }, // azul
  { texto: "#0E7C6B", fundo: "rgba(14,124,107,.12)" }, // verde-azulado
  { texto: "#B0655C", fundo: "rgba(176,101,92,.14)" }, // vermelho
  { texto: "#8A5CB8", fundo: "rgba(138,92,184,.12)" }, // roxo
  { texto: "#C08A3E", fundo: "rgba(192,138,62,.14)" }, // âmbar
  { texto: "#3A7CA5", fundo: "rgba(58,124,165,.12)" }, // azul-petróleo
  { texto: "#B8548A", fundo: "rgba(184,84,138,.12)" }, // magenta
  { texto: "#5C8A3A", fundo: "rgba(92,138,58,.12)" }, // verde-oliva
];
