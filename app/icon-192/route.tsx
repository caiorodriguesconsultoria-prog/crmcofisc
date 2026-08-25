import { ImageResponse } from "next/og";

// Ícone dedicado pro manifest.ts (Chrome/Android "Adicionar à tela inicial")
// — separado do /icon (favicon 32x32) porque o manifest exige tamanhos
// específicos (192 e 512) pra considerar o app instalável.
export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#2F5FDB",
          color: "#fff",
          fontSize: 96,
          fontWeight: 800,
          fontFamily: "sans-serif",
          letterSpacing: -4,
        }}
      >
        CC
      </div>
    ),
    { width: 192, height: 192 },
  );
}
