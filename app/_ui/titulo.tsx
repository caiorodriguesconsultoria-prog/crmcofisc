import { cor } from "@/lib/theme";

// Título com fundo em pílula (acento azul) atrás, texto preto sólido —
// o "destaque" vem do selo, não da cor do texto.
export default function TituloDestaque({
  children,
  fontSize = 20,
}: {
  children: React.ReactNode;
  fontSize?: number;
}) {
  return (
    <h1
      style={{
        display: "inline-flex",
        alignItems: "center",
        margin: 0,
        background: cor.destaqueFundo,
        padding: "5px 14px",
        borderRadius: 12,
      }}
    >
      <span style={{ fontSize, fontWeight: 800, color: cor.texto, letterSpacing: -0.3, lineHeight: 1 }}>
        {children}
      </span>
    </h1>
  );
}
