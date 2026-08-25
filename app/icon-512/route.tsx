import { ImageResponse } from "next/og";

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
          fontSize: 256,
          fontWeight: 800,
          fontFamily: "sans-serif",
          letterSpacing: -10,
        }}
      >
        CC
      </div>
    ),
    { width: 512, height: 512 },
  );
}
