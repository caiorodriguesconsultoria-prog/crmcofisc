import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
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
          borderRadius: 7,
          color: "#fff",
          fontSize: 18,
          fontWeight: 800,
          fontFamily: "sans-serif",
          letterSpacing: -1,
        }}
      >
        CC
      </div>
    ),
    { ...size },
  );
}
