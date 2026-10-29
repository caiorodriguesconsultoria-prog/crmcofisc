import { cor, raio } from "@/lib/theme";

// Retângulo de contorno fino, raio 8px, sem preenchimento — coordenação,
// forma de entrega, natureza da ocorrência etc. Nunca usa cor de urgência
// nem o acento quente (essas são reservadas pra IndicadorUrgencia e pro
// card de destaque único). Ver design-system/REGRAS.md.
export default function TagRotulo({
  texto,
  corTexto,
}: {
  texto: string;
  /** Cor do texto/contorno — ex. a cor calculada em lib/cores-evento.ts. Padrão: neutro. */
  corTexto?: string;
}) {
  const c = corTexto ?? cor.textoSecundario;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        fontSize: 11,
        fontWeight: 600,
        padding: "3px 9px",
        borderRadius: raio.tag,
        border: `1px solid ${c}55`,
        color: c,
        background: "transparent",
      }}
    >
      {texto}
    </span>
  );
}
