import { cor } from "@/lib/theme";

export type NivelUrgencia = "ok" | "atencao" | "critico";

const CORES_PONTO: Record<NivelUrgencia, string> = {
  ok: cor.positivo,
  atencao: cor.atencao,
  critico: cor.urgente,
};

// Texto numa versão mais escura da mesma cor — as cores "cheias" acima têm
// só 3,0 a 4,3:1 de contraste contra branco (abaixo dos 4,5:1 exigidos pra
// texto pequeno), passam só como ponto/elemento gráfico (mínimo 3:1). Ver
// a nota em lib/theme.ts (Etapa 6 do redesenho — revisão de contraste).
const CORES_TEXTO: Record<NivelUrgencia, string> = {
  ok: cor.positivoTexto,
  atencao: cor.atencaoTexto,
  critico: cor.urgenteTexto,
};

// Substitui pílula de status preenchida — ponto de 8px mais o texto do
// prazo na cor do estado, sem fundo. A urgência nunca depende só da cor:
// o texto ao lado é obrigatório (acessibilidade — contraste e leitores de
// tela). Ver design-system/REGRAS.md.
export default function IndicadorUrgencia({
  nivel,
  texto,
  textoEscuro,
}: {
  nivel: NivelUrgencia;
  texto: string;
  /** Protótipo do vidro/tema escuro (Painel) — as versões escurecidas de
   * CORES_TEXTO foram calibradas pra contraste contra fundo BRANCO; em
   * cima do vidro escuro ficam baixo contraste (verde/âmbar/vermelho
   * escuros sobre marrom escuro). Usa a versão "cheia" (mais clara) nesse
   * caso, que já tem contraste bom o bastante contra um fundo escuro. */
  textoEscuro?: boolean;
}) {
  const corTexto = textoEscuro ? CORES_PONTO[nivel] : CORES_TEXTO[nivel];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 600, color: corTexto }}>
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: CORES_PONTO[nivel], flex: "none" }} />
      {texto}
    </span>
  );
}
