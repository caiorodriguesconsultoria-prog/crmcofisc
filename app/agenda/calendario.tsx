"use client";

import { useState } from "react";
import Link from "next/link";
import { card, cor } from "@/lib/theme";

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
    <div style={{ ...card, marginTop: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <button onClick={() => mudarMes(-1)}>← Anterior</button>
        <strong style={{ fontSize: 14 }}>
          {MESES[mes]} {ano}
        </strong>
        <button onClick={() => mudarMes(1)}>Próximo →</button>
        <button onClick={irParaHoje}>Hoje</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 5 }}>
        {DIAS_SEMANA.map((d) => (
          <div
            key={d}
            style={{ fontSize: 11, fontWeight: 700, textAlign: "center", padding: 4, color: cor.textoTerciario }}
          >
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
                minHeight: 76,
                border: `1px solid ${cor.borda}`,
                borderRadius: 10,
                padding: 5,
                background: ehHoje(dia) ? cor.fundo : "transparent",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  color: ehHoje(dia) ? cor.texto : cor.textoTerciario,
                  fontWeight: ehHoje(dia) ? 700 : 400,
                }}
              >
                {dia}
              </div>
              {prazosDoDia.map((p) => (
                <Link
                  key={p.id}
                  href={`/processos/${p.id}`}
                  style={{
                    display: "block",
                    fontSize: 10.5,
                    fontWeight: 600,
                    marginTop: 3,
                    padding: "2px 5px",
                    background: cor.urgenteFundo,
                    color: cor.urgente,
                    borderRadius: 6,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    textDecoration: "none",
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
        <p style={{ color: cor.textoTerciario, marginTop: 12, fontSize: 13 }}>
          Nenhum processo com prazo definido.
        </p>
      )}
    </div>
  );
}
