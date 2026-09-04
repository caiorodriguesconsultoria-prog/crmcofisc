export const cor = {
  // Azul bem clarinho, no mesmo nível de claridade do bege antigo (#F6F3F0)
  // — mesma "temperatura" visual, só troca o matiz quente pelo frio.
  fundo: "#EFF3FB",
  branco: "#FFFFFF",
  texto: "#201F1D",
  textoSecundario: "#605D5D",
  textoTerciario: "#7D7979",
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
  atencao: "#C08A3E",
  atencaoFundo: "rgba(192,138,62,.14)",
  urgente: "#B0655C",
  urgenteFundo: "rgba(176,101,92,.14)",
  escuro: "#2D2B2B",
};

export const sombraCard = "0 1px 2px rgba(32,31,29,.035)";
export const sombraFlutuante = "0 1px 2px rgba(0,0,0,.07), 0 6px 16px rgba(0,0,0,.05)";

export const card: React.CSSProperties = {
  background: cor.branco,
  borderRadius: 18,
  padding: "18px 20px",
  border: `1px solid ${cor.borda}`,
  boxShadow: sombraCard,
};

export const botaoPrimario: React.CSSProperties = {
  background: `linear-gradient(180deg, #4C7EF0, ${cor.azul})`,
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

// Título em destaque (gradiente azul) — usado nos cabeçalhos dos painéis
// (Painel/PainelAlto/PainelAltoModal), pra dar mais vida ao topo de cada tela.
export const tituloDestaque: React.CSSProperties = {
  backgroundImage: `linear-gradient(90deg, ${cor.azulEscuro}, ${cor.azul} 55%, #6C93F5)`,
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  letterSpacing: -0.3,
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
