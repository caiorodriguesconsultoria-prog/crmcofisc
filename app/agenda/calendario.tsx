"use client";

import { useState } from "react";
import Link from "next/link";

type Prazo = {
  id: string;
  numeroContrato: string;
  prazoData: string;
  coordenacaoSigla: string;
  fornecedorNome: string;
};

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

function chavePrazo(prazoData: string) {
  return prazoData.slice(0, 10);
}

export default function Calendario({ prazos }: { prazos: Prazo[] }) {
  const hoje = new Date();
  const [ano, setAno] = useState(hoje.getFullYear());
  const [mes, setMes] = useState(hoje.getMonth());

  const prazosPorDia = new Map<string, Prazo[]>();
  for (const p of prazos) {
    const chave = chavePrazo(p.prazoData);
    const lista = prazosPorDia.get(chave) ?? [];
    lista.push(p);
    prazosPorDia.set(chave, lista);
  }

  const primeiroDiaSemana = new Date(ano, mes, 1).getDay();
  const diasNoMes = new Date(ano, mes + 1, 0).getDate();

  const celulas: (number | null)[] = [
    ...Array(primeiroDiaSemana).fill(null),
    ...Array.from({ length: diasNoMes }, (_, i) => i + 1),
  ];

  function mudarMes(delta: number) {
    const novo = new Date(ano, mes + delta, 1);
    setAno(novo.getFullYear());
    setMes(novo.getMonth());
  }

  function irParaHoje() {
    setAno(hoje.getFullYear());
    setMes(hoje.getMonth());
  }

  function chaveDoDia(dia: number) {
    return `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
  }

  const ehHoje = (dia: number) =>
    ano === hoje.getFullYear() && mes === hoje.getMonth() && dia === hoje.getDate();

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <button onClick={() => mudarMes(-1)}>← Anterior</button>
        <strong>
          {MESES[mes]} {ano}
        </strong>
        <button onClick={() => mudarMes(1)}>Próximo →</button>
        <button onClick={irParaHoje}>Hoje</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
        {DIAS_SEMANA.map((d) => (
          <div key={d} style={{ fontSize: 12, fontWeight: "bold", textAlign: "center", padding: 4 }}>
            {d}
          </div>
        ))}
        {celulas.map((dia, i) => {
          if (dia === null) {
            return <div key={`vazio-${i}`} />;
          }
          const prazosDoDia = prazosPorDia.get(chaveDoDia(dia)) ?? [];
          return (
            <div
              key={dia}
              style={{
                minHeight: 72,
                border: "1px solid #eee",
                borderRadius: 4,
                padding: 4,
                background: ehHoje(dia) ? "#F5F4F3" : "transparent",
              }}
            >
              <div style={{ fontSize: 12, color: ehHoje(dia) ? "#000" : "#7D7979", fontWeight: ehHoje(dia) ? "bold" : "normal" }}>
                {dia}
              </div>
              {prazosDoDia.map((p) => (
                <Link
                  key={p.id}
                  href={`/processos/${p.id}`}
                  style={{
                    display: "block",
                    fontSize: 11,
                    marginTop: 2,
                    padding: "1px 3px",
                    background: "#B0655C",
                    color: "#fff",
                    borderRadius: 2,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  title={`${p.numeroContrato} — ${p.fornecedorNome}`}
                >
                  {p.numeroContrato}
                </Link>
              ))}
            </div>
          );
        })}
      </div>

      {prazos.length === 0 && (
        <p style={{ color: "#7D7979", marginTop: 12 }}>Nenhum processo com prazo definido.</p>
      )}
    </div>
  );
}
