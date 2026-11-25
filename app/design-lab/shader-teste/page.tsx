"use client";

import { useState } from "react";
import { MeshGradient, StaticMeshGradient } from "@paper-design/shaders-react";
import AmbientBackground from "../_glass/ambient-background";
import FiltroRefracaoSVG from "../_glass/refracao";
import { GlassCard } from "../_glass/componentes";

// /design-lab/shader-teste — comparação lado a lado (não é tela do
// produto): fundo atual (SVG estático, _glass/ambient-background.tsx) vs.
// candidato @paper-design/shaders-react (WebGL, MeshGradient). Objetivo:
// decidir se vale trocar com base em desempenho medido, não achismo —
// ver app/design-lab/CONHECIMENTO.md pra decisão e números.
const CORES = ["#dce7f8", "#78A9E8", "#A6CFFF", "#D5E9FF", "#568CD5"];

export default function ShaderTestePage() {
  const [modo, setModo] = useState<"svg" | "shader-animado" | "shader-estatico" | "shader-estatico-vidro">("svg");

  return (
    <div style={{ minHeight: "100vh", position: "relative" }}>
      <FiltroRefracaoSVG />
      {modo === "svg" && <AmbientBackground escuro={false} />}
      {modo === "shader-animado" && (
        <MeshGradient style={{ position: "fixed", inset: 0, zIndex: -1 }} colors={CORES} distortion={0.8} swirl={0.3} speed={0.3} />
      )}
      {(modo === "shader-estatico" || modo === "shader-estatico-vidro") && (
        <StaticMeshGradient style={{ position: "fixed", inset: 0, zIndex: -1 }} colors={CORES} waveX={0.3} waveY={0.3} mixing={0.5} speed={0} />
      )}
      {modo === "shader-estatico-vidro" && (
        <div style={{ position: "relative", padding: 24, maxWidth: 360 }}>
          <GlassCard titulo="Card de teste">
            <div style={{ fontSize: 22, fontWeight: 700 }}>Vidro sobre o shader</div>
          </GlassCard>
        </div>
      )}

      <div style={{ position: "relative", padding: 24, display: "flex", gap: 10, flexWrap: "wrap" }}>
        {(["svg", "shader-animado", "shader-estatico", "shader-estatico-vidro"] as const).map((m) => (
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
            {m === "svg" ? "SVG (produto atual)" : m === "shader-animado" ? "Shader animado" : m === "shader-estatico" ? "Shader estático" : "Shader estático + vidro"}
          </button>
        ))}
      </div>
    </div>
  );
}
