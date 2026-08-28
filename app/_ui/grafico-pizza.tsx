"use client";

import { cor } from "@/lib/theme";

type Fatia = { rotulo: string; valor: number; cor: string };

const GAP_GRAUS = 1.5;

function polarParaCartesiano(cx: number, cy: number, r: number, anguloGraus: number) {
  const rad = ((anguloGraus - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcoPath(cx: number, cy: number, rExterno: number, rInterno: number, anguloInicio: number, anguloFim: number) {
  const inicioExt = polarParaCartesiano(cx, cy, rExterno, anguloFim);
  const fimExt = polarParaCartesiano(cx, cy, rExterno, anguloInicio);
  const inicioInt = polarParaCartesiano(cx, cy, rInterno, anguloInicio);
  const fimInt = polarParaCartesiano(cx, cy, rInterno, anguloFim);
  const grandeArco = anguloFim - anguloInicio <= 180 ? 0 : 1;
  return [
    `M ${inicioExt.x} ${inicioExt.y}`,
    `A ${rExterno} ${rExterno} 0 ${grandeArco} 0 ${fimExt.x} ${fimExt.y}`,
    `L ${inicioInt.x} ${inicioInt.y}`,
    `A ${rInterno} ${rInterno} 0 ${grandeArco} 1 ${fimInt.x} ${fimInt.y}`,
    "Z",
  ].join(" ");
}

// Donut simples em SVG puro (sem lib) — só faz sentido pra categorias
// mutuamente exclusivas, onde as fatias somam o total de verdade (ex.:
// etapa, onde cada processo está em exatamente uma). Ver components.md
// da skill de dataviz.
export default function GraficoPizza({
  dados,
  tamanho = 180,
  rotuloCentro,
}: {
  dados: Fatia[];
  tamanho?: number;
  rotuloCentro?: string;
}) {
  const total = dados.reduce((soma, d) => soma + d.valor, 0);
  const raio = tamanho / 2;
  const raioInterno = raio * 0.6;
  let anguloAtual = 0;
  const fatias = dados
    .filter((d) => d.valor > 0)
    .map((d) => {
      const fracao = total > 0 ? d.valor / total : 0;
      const anguloInicio = anguloAtual + GAP_GRAUS / 2;
      anguloAtual += fracao * 360;
      const anguloFim = Math.max(anguloAtual - GAP_GRAUS / 2, anguloInicio + 0.01);
      return { ...d, anguloInicio, anguloFim, fracao };
    });

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
      <svg width={tamanho} height={tamanho} viewBox={`0 0 ${tamanho} ${tamanho}`} style={{ flex: "none" }}>
        {fatias.map((f) => (
          <path key={f.rotulo} d={arcoPath(raio, raio, raio, raioInterno, f.anguloInicio, f.anguloFim)} fill={f.cor}>
            <title>{`${f.rotulo}: ${f.valor} (${(f.fracao * 100).toFixed(0)}%)`}</title>
          </path>
        ))}
        <text x={raio} y={raio - 4} textAnchor="middle" fontSize={20} fontWeight={700} fill={cor.texto}>
          {total}
        </text>
        {rotuloCentro && (
          <text x={raio} y={raio + 14} textAnchor="middle" fontSize={9.5} fill={cor.textoTerciario}>
            {rotuloCentro}
          </text>
        )}
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 5, minWidth: 160, flex: "1 1 160px" }}>
        {dados.map((d) => (
          <div key={d.rotulo} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12 }}>
            <span style={{ width: 9, height: 9, borderRadius: "50%", background: d.cor, flex: "none" }} />
            <span style={{ flex: 1, minWidth: 0, color: cor.texto }}>{d.rotulo}</span>
            <span style={{ fontWeight: 600, color: cor.textoSecundario, flex: "none" }}>
              {d.valor}
              {total > 0 ? ` (${((d.valor / total) * 100).toFixed(0)}%)` : ""}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
