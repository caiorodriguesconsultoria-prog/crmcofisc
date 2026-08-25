import { cor, tituloDestaque } from "@/lib/theme";

// Título com fundo em pílula (na mesma cor do acento azul do texto) atrás,
// pra dar destaque real ao título — não só a cor do texto, um "selo" visível.
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
        display: "inline-block",
        margin: 0,
        background: cor.destaqueFundo,
        padding: "5px 14px",
        borderRadius: 12,
      }}
    >
      <span style={{ ...tituloDestaque, fontSize, fontWeight: 800 }}>{children}</span>
    </h1>
  );
}
