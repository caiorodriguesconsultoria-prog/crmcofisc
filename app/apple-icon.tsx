import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
        <span style={{ fontSize: 34, fontWeight: 800, color: "#000", fontFamily: "sans-serif", letterSpacing: -1 }}>
          COFISC
        </span>
      </div>
    ),
    { ...size },
  );
}
