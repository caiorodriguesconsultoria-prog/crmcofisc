"use client";

import Link from "next/link";
import { cor, raio } from "@/lib/theme";

type Prazo = {
  id: string;
  numeroContrato: string;
  prazoData: string;
  coordenacaoSigla: string;
  fornecedorNome: string;
};

type Agendamento = {
  id: string;
  processoId: string;
  numeroContrato: string;
  data: string;
  horario: string;
  observacao: string | null;
};

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function chaveDia(data: Date) {
  return data.toISOString().slice(0, 10);
}

// Agenda semanal (Etapa 5 do redesenho) — espelha os mesmos dados que o
// calendário mensal de baixo já usa (nenhuma consulta nova), só num formato
// de linha pra ver a semana corrente de relance. O calendário mensal
// continua existindo pra navegar outros meses — essa faixa é um resumo, não
// substitui. Ver design-system/REGRAS.md.
export default function Semana({ prazos, agendamentos }: { prazos: Prazo[]; agendamentos: Agendamento[] }) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const inicioSemana = new Date(hoje);
  inicioSemana.setDate(hoje.getDate() - hoje.getDay());

  const dias = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(inicioSemana);
    d.setDate(inicioSemana.getDate() + i);
    return d;
  });

  type ItemDia = { id: string; horario: string | null; texto: string; href: string };

  const itensPorDia = new Map<string, ItemDia[]>();
  function adicionar(chave: string, item: ItemDia) {
    const lista = itensPorDia.get(chave) ?? [];
    lista.push(item);
    itensPorDia.set(chave, lista);
  }
  for (const p of prazos) {
    adicionar(p.prazoData.slice(0, 10), {
      id: `prazo-${p.id}`,
      horario: null,
      texto: `CT ${p.numeroContrato} — prazo`,
      href: `/processos/${p.id}`,
    });
  }
  for (const a of agendamentos) {
    adicionar(a.data.slice(0, 10), {
      id: `ag-${a.id}`,
      horario: a.horario,
      texto: `CT ${a.numeroContrato}${a.observacao ? ` — ${a.observacao}` : ""}`,
      href: `/processos/${a.processoId}`,
    });
  }
  for (const lista of itensPorDia.values()) {
    lista.sort((x, y) => (x.horario ?? "23:59:59").localeCompare(y.horario ?? "23:59:59"));
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
      {dias.map((dia) => {
        const chave = chaveDia(dia);
        const ehHoje = chave === chaveDia(hoje);
        const itens = itensPorDia.get(chave) ?? [];
        return (
          <div key={chave} style={{ minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
                padding: "8px 4px",
                borderRadius: raio.pilula,
                background: ehHoje ? cor.escuro : "transparent",
                color: ehHoje ? "#fff" : cor.textoSecundario,
              }}
            >
              <span style={{ fontSize: 10.5, fontWeight: 600, textTransform: "uppercase" }}>
                {DIAS_SEMANA[dia.getDay()]}
              </span>
              <span style={{ fontSize: 15, fontWeight: 700 }}>{dia.getDate()}</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 6 }}>
              {itens.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  title={item.texto}
                  style={{
                    display: "block",
                    fontSize: 10.5,
                    fontWeight: 600,
                    padding: "5px 7px",
                    borderRadius: 9,
                    background: cor.escuro,
                    color: "#fff",
                    textDecoration: "none",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.horario ? `${item.horario.slice(0, 5)} · ` : ""}
                  {item.texto}
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
