"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { botaoPrimario, cor } from "@/lib/theme";

type Agendamento = {
  id: string;
  data: string;
  horario: string;
  observacao: string | null;
};

function formatarData(data: string) {
  return new Date(`${data}T00:00:00`).toLocaleDateString("pt-BR");
}

function formatarHorario(horario: string) {
  return horario.slice(0, 5);
}

export default function Agendamentos({
  processoId,
  agendamentos,
}: {
  processoId: string;
  agendamentos: Agendamento[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState<string | null>(null);
  const [novo, setNovo] = useState(false);
  const [data, setData] = useState("");
  const [horario, setHorario] = useState("");
  const [observacao, setObservacao] = useState("");

  const ordenados = [...agendamentos].sort((a, b) =>
    a.data === b.data ? a.horario.localeCompare(b.horario) : a.data.localeCompare(b.data),
  );

  async function adicionar() {
    if (!data || !horario) return;
    setErro(null);
    setCarregando("novo");
    const { error } = await supabase.from("processo_agendamentos").insert({
      processo_id: processoId,
      data,
      horario,
      observacao: observacao.trim() || null,
    });
    setCarregando(null);
    if (error) {
      setErro(error.message);
      return;
    }
    setNovo(false);
    setData("");
    setHorario("");
    setObservacao("");
    router.refresh();
  }

  async function remover(id: string) {
    setErro(null);
    setCarregando(id);
    const { error } = await supabase.from("processo_agendamentos").delete().eq("id", id);
    setCarregando(null);
    if (error) {
      setErro(error.message);
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <strong style={{ fontSize: 13 }}>Agendamentos de entrega</strong>
      <p style={{ fontSize: 12, color: cor.textoTerciario, margin: "2px 0 8px" }}>
        Data e horário aparecem no card do Kanban, na lista de Processos e na Agenda.
      </p>

      {erro && <p style={{ color: cor.urgente, margin: "0 0 8px" }}>{erro}</p>}

      {ordenados.length === 0 ? (
        <p style={{ fontSize: 13, color: cor.textoTerciario, margin: 0 }}>Nenhum agendamento ainda.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {ordenados.map((a) => (
            <div
              key={a.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 12.5,
                borderBottom: `1px solid ${cor.borda}`,
                paddingBottom: 6,
              }}
            >
              <span style={{ fontWeight: 600 }}>
                {formatarData(a.data)} · {formatarHorario(a.horario)}
              </span>
              {a.observacao && <span style={{ color: cor.textoTerciario }}>{a.observacao}</span>}
              <button
                type="button"
                onClick={() => remover(a.id)}
                disabled={carregando === a.id}
                style={{ marginLeft: "auto", fontSize: 10.5, padding: "3px 8px" }}
              >
                remover
              </button>
            </div>
          ))}
        </div>
      )}

      {novo ? (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            marginTop: 10,
            padding: 10,
            background: cor.fundo,
            borderRadius: 10,
            alignItems: "center",
          }}
        >
          <input type="date" value={data} onChange={(e) => setData(e.target.value)} style={{ padding: 6 }} />
          <input type="time" value={horario} onChange={(e) => setHorario(e.target.value)} style={{ padding: 6 }} />
          <input
            placeholder="Observação (opcional)"
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            style={{ padding: 6, flex: 1, minWidth: 140 }}
          />
          <button
            onClick={adicionar}
            disabled={carregando === "novo" || !data || !horario}
            style={{ ...botaoPrimario, fontSize: 11, padding: "6px 12px" }}
          >
            Salvar
          </button>
          <button onClick={() => setNovo(false)} disabled={carregando === "novo"} style={{ fontSize: 11 }}>
            Cancelar
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => setNovo(true)} style={{ marginTop: 8, fontSize: 12, color: cor.textoTerciario, borderStyle: "dashed" }}>
          + Adicionar agendamento
        </button>
      )}
    </div>
  );
}
