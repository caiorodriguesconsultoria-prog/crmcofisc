export const cor = {
  fundo: "#F8F4F4",
  branco: "#fff",
  texto: "#201F1D",
  textoSecundario: "#605D5D",
  textoTerciario: "#7D7979",
  borda: "rgba(32,31,29,.07)",
  destaque: "#7D5411",
  destaqueFundo: "rgba(182,130,53,.07)",
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
  background: "linear-gradient(180deg,#4A4645,#2D2B2B)",
  color: "#fff",
  fontSize: 13,
  fontWeight: 600,
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
