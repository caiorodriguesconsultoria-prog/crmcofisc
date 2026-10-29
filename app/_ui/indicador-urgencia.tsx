import { cor } from "@/lib/theme";

export type NivelUrgencia = "ok" | "atencao" | "critico";

const CORES: Record<NivelUrgencia, string> = {
  ok: cor.positivo,
  atencao: cor.atencao,
  critico: cor.urgente,
};

// Substitui pílula de status preenchida — ponto de 8px mais o texto do
// prazo na cor do estado, sem fundo. A urgência nunca depende só da cor:
// o texto ao lado é obrigatório (acessibilidade — contraste e leitores de
// tela). Ver design-system/REGRAS.md.
export default function IndicadorUrgencia({
  nivel,
  texto,
}: {
  nivel: NivelUrgencia;
  texto: string;
}) {
  const corAtual = CORES[nivel];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 600, color: corAtual }}>
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: corAtual, flex: "none" }} />
      {texto}
    </span>
  );
}
