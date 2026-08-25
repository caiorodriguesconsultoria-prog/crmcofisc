"use client";

import { useState } from "react";
import Link from "next/link";
import { card, cor } from "@/lib/theme";

type Processo = {
  id: string;
  numeroContrato: string;
  etapaAtual: string;
  diasParado: number | null;
};

export default function PainelDashboard({
  processos,
  contagemPorEtapa,
  ativos,
  concluidos,
  vencendoHoje,
}: {
  processos: Processo[];
  contagemPorEtapa: Record<string, number>;
  ativos: number;
  concluidos: number;
  vencendoHoje: number;
}) {
  const [limiteDias, setLimiteDias] = useState(15);

  const parados = processos
    .filter((p) => p.diasParado !== null && p.diasParado >= limiteDias)
    .sort((a, b) => (b.diasParado ?? 0) - (a.diasParado ?? 0));

  const maiorEtapa = Math.max(1, ...Object.values(contagemPorEtapa));

  return (
    <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <div style={{ ...card, flex: "1 1 160px" }}>
          <span style={{ fontSize: 10.5, textTransform: "uppercase", color: cor.textoTerciario, letterSpacing: 0.5 }}>
            Total de processos
          </span>
          <p style={{ fontSize: 28, fontWeight: 700, margin: "4px 0 0" }}>{processos.length}</p>
        </div>
        <div style={{ ...card, flex: "1 1 160px" }}>
          <span style={{ fontSize: 10.5, textTransform: "uppercase", color: cor.textoTerciario, letterSpacing: 0.5 }}>
            Ativos
          </span>
          <p style={{ fontSize: 28, fontWeight: 700, margin: "4px 0 0" }}>{ativos}</p>
        </div>
        <div style={{ ...card, flex: "1 1 160px" }}>
          <span style={{ fontSize: 10.5, textTransform: "uppercase", color: cor.textoTerciario, letterSpacing: 0.5 }}>
            Concluídos
          </span>
          <p style={{ fontSize: 28, fontWeight: 700, margin: "4px 0 0", color: cor.positivo }}>{concluidos}</p>
        </div>
        <div style={{ ...card, flex: "1 1 160px" }}>
          <span style={{ fontSize: 10.5, textTransform: "uppercase", color: cor.textoTerciario, letterSpacing: 0.5 }}>
            Vencendo hoje
          </span>
          <p style={{ fontSize: 28, fontWeight: 700, margin: "4px 0 0", color: vencendoHoje > 0 ? cor.urgente : cor.texto }}>
            {vencendoHoje}
          </p>
        </div>
      </div>

      <div style={card}>
        <strong style={{ fontSize: 13 }}>Processos por etapa</strong>
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
          {Object.entries(contagemPorEtapa).map(([etapa, n]) => (
            <div key={etapa} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 12.5, flex: "0 0 220px" }}>{etapa}</span>
              <div style={{ flex: 1, height: 8, borderRadius: 4, background: "rgba(32,31,29,.08)", overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    borderRadius: 4,
                    background: cor.positivo,
                    width: `${(n / maiorEtapa) * 100}%`,
                  }}
                />
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: cor.textoTerciario, width: 24, textAlign: "right" }}>
                {n}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div style={card}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <strong style={{ fontSize: 13 }}>Processos parados</strong>
          <label style={{ marginLeft: "auto", fontSize: 12, color: cor.textoTerciario }}>
            a partir de{" "}
            <input
              type="number"
              min={1}
              value={limiteDias}
              onChange={(e) => setLimiteDias(Number(e.target.value) || 1)}
              style={{ width: 50, padding: 4, borderRadius: 6, border: `1px solid ${cor.borda}` }}
            />{" "}
            dias na mesma etapa
          </label>
        </div>
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
          {parados.length === 0 && (
            <p style={{ color: cor.textoTerciario, fontSize: 13, margin: 0 }}>
              Nenhum processo parado além do limite.
            </p>
          )}
          {parados.map((p) => (
            <Link
              key={p.id}
              href={`/processos/${p.id}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 11px",
                borderRadius: 12,
                background: cor.fundo,
                textDecoration: "none",
                color: cor.texto,
                fontSize: 12.5,
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: cor.urgente, flex: "none" }} />
              <strong>{p.numeroContrato}</strong>
              <span style={{ color: cor.textoTerciario }}>{p.etapaAtual}</span>
              <span style={{ marginLeft: "auto", color: cor.textoTerciario }}>há {p.diasParado} dias</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
