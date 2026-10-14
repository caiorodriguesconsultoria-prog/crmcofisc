import { cor } from "./theme";

// Cada etapa do Kanban com uma cor própria, fácil de distinguir à distância
// na listagem de contratos — antes todas usavam a mesma cor (azul claro de
// destaque), difícil de bater o olho e diferenciar.
export function corEtapa(etapaAtual: string): { texto: string; fundo: string } {
  switch (etapaAtual) {
    case "Aguardando assinatura":
      return { texto: cor.amarelo, fundo: cor.amareloFundo };
    case "Aguardando pagamento":
      return { texto: cor.verdeEscuro, fundo: cor.verdeEscuroFundo };
    case "Aguardando Área Técnica":
      return { texto: cor.laranja, fundo: cor.laranjaFundo };
    case "Aguardando entrega":
      return { texto: cor.azulEscuro, fundo: cor.azulFundo };
    default:
      return { texto: cor.destaque, fundo: cor.destaqueFundo };
  }
}
