import { PALETA_EVENTOS } from "./theme";

function hexParaFundo(hex: string): string {
  const limpo = hex.replace("#", "");
  const r = parseInt(limpo.substring(0, 2), 16);
  const g = parseInt(limpo.substring(2, 4), 16);
  const b = parseInt(limpo.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, .12)`;
}

// Escolhe a cor de um evento: se a tag tem cor escolhida manualmente, usa
// ela (com uma versão clara pro fundo); senão cai numa cor estável da
// paleta a partir do hash do id — a mesma tag sempre cai na mesma cor em
// qualquer tela, sem precisar guardar cor no banco.
export function corEvento(id: string, corPersonalizada?: string | null) {
  if (corPersonalizada) {
    return { texto: corPersonalizada, fundo: hexParaFundo(corPersonalizada) };
  }
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return PALETA_EVENTOS[hash % PALETA_EVENTOS.length];
}
