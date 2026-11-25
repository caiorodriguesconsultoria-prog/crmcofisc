"use client";

import { useState } from "react";
import { MeshGradient, StaticMeshGradient } from "@paper-design/shaders-react";
import AmbientBackground from "../_glass/ambient-background";

// /design-lab/shader-teste — comparação lado a lado (não é tela do
// produto): fundo atual (SVG estático, _glass/ambient-background.tsx) vs.
// candidato @paper-design/shaders-react (WebGL, MeshGradient). Objetivo:
// decidir se vale trocar com base em desempenho medido, não achismo —
// ver app/design-lab/CONHECIMENTO.md pra decisão e números.
const CORES = ["#dce7f8", "#78A9E8", "#A6CFFF", "#D5E9FF", "#568CD5"];

export default function ShaderTestePage() {
  const [modo, setModo] = useState<"svg" | "shader-animado" | "shader-estatico">("svg");

  return (
    <div style={{ minHeight: "100vh", position: "relative" }}>
      {modo === "svg" && <AmbientBackground escuro={false} />}
      {modo === "shader-animado" && (
        <MeshGradient style={{ position: "fixed", inset: 0, zIndex: -1 }} colors={CORES} distortion={0.8} swirl={0.3} speed={0.3} />
      )}
      {modo === "shader-estatico" && (
        <StaticMeshGradient style={{ position: "fixed", inset: 0, zIndex: -1 }} colors={CORES} waveX={0.3} waveY={0.3} mixing={0.5} />
      )}

      <div style={{ position: "relative", padding: 24, display: "flex", gap: 10 }}>
        {(["svg", "shader-animado", "shader-estatico"] as const).map((m) => (
          <button
            key={m}
            type="button"
            data-testid={`modo-${m}`}
            onClick={() => setModo(m)}
            style={{
              padding: "10px 18px",
              borderRadius: 999,
              border: modo === m ? "2px solid #2F5FDB" : "1px solid rgba(32,31,29,.15)",
              background: "#fff",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            {m === "svg" ? "SVG (produto atual)" : m === "shader-animado" ? "Shader animado" : "Shader estático"}
          </button>
        ))}
      </div>
    </div>
  );
}
