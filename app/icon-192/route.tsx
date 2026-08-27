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
          background: "linear-gradient(90deg, #22C1DC 0%, #8FD79A 50%, #F4E266 100%)",
        }}
      >
        <span style={{ fontSize: 36, fontWeight: 800, color: "#000", fontFamily: "sans-serif", letterSpacing: -1 }}>
          COFISC
        </span>
      </div>
    ),
    { width: 192, height: 192 },
  );
}
