"use client";

import { useState } from "react";
import Link from "next/link";

type Processo = {
  id: string;
  numeroContrato: string;
  etapaAtual: string;
  diasParado: number | null;
};

export default function PainelDashboard({
  processos,
  contagemPorEtapa,
  eventosAtivos,
}: {
  processos: Processo[];
  contagemPorEtapa: Record<string, number>;
  eventosAtivos: number;
}) {
  const [limiteDias, setLimiteDias] = useState(15);

  const parados = processos
    .filter((p) => p.diasParado !== null && p.diasParado >= limiteDias)
    .sort((a, b) => (b.diasParado ?? 0) - (a.diasParado ?? 0));

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        <div>
          <strong>Total de processos</strong>
          <p style={{ fontSize: 24, margin: 0 }}>{processos.length}</p>
        </div>
        <div>
          <strong>Eventos ativos</strong>
          <p style={{ fontSize: 24, margin: 0 }}>{eventosAtivos}</p>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <strong>Processos por etapa</strong>
        <ul style={{ marginTop: 4 }}>
          {Object.entries(contagemPorEtapa).map(([etapa, n]) => (
            <li key={etapa}>
              {etapa}: {n}
            </li>
          ))}
        </ul>
      </div>

      <div style={{ marginTop: 16 }}>
        <label>
          Considerar parado a partir de{" "}
          <input
            type="number"
            min={1}
            value={limiteDias}
            onChange={(e) => setLimiteDias(Number(e.target.value) || 1)}
            style={{ width: 60, padding: 4 }}
          />{" "}
          dias na mesma etapa
        </label>
        <ul style={{ marginTop: 8 }}>
          {parados.length === 0 && (
            <li style={{ color: "#7D7979" }}>Nenhum processo parado além do limite.</li>
          )}
          {parados.map((p) => (
            <li key={p.id}>
              <Link href={`/processos/${p.id}`}>{p.numeroContrato}</Link> — {p.etapaAtual} há{" "}
              {p.diasParado} dias
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
