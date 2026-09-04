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
          background: "linear-gradient(90deg, #22C1DC 0%, #8FD79A 50%, #F4E266 100%)",
        }}
      >
        <span style={{ fontSize: 96, fontWeight: 800, color: "#000", fontFamily: "sans-serif", letterSpacing: -3 }}>
          COFISC
        </span>
      </div>
    ),
    { width: 512, height: 512 },
  );
}
