"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Execucao = {
  id: string;
  numero: number;
  quantidade: number;
  unidade: string | null;
  data_prevista: string | null;
  situacao: string;
};

const SITUACOES = ["pendente", "em_transito", "entregue", "atrasada"];

export default function Cronograma({
  processoId,
  execucoes,
}: {
  processoId: string;
  execucoes: Execucao[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState<string | null>(null);
  const [novo, setNovo] = useState(false);
  const [novaQuantidade, setNovaQuantidade] = useState("");
  const [novaUnidade, setNovaUnidade] = useState("");
  const [novaData, setNovaData] = useState("");

  const proximoNumero = execucoes.length > 0 ? Math.max(...execucoes.map((e) => e.numero)) + 1 : 1;

  async function atualizarSituacao(execucaoId: string, situacao: string) {
    setErro(null);
    setCarregando(execucaoId);
    const { error } = await supabase.from("processo_execucoes").update({ situacao }).eq("id", execucaoId);
    setCarregando(null);
    if (error) {
      setErro(error.message);
      return;
    }
    router.refresh();
  }

  async function remover(execucaoId: string) {
    setErro(null);
    setCarregando(execucaoId);
    const { error } = await supabase.from("processo_execucoes").delete().eq("id", execucaoId);
    setCarregando(null);
    if (error) {
      setErro(error.message);
      return;
    }
    router.refresh();
  }

  async function adicionar() {
    if (!novaQuantidade) return;
    setErro(null);
    setCarregando("novo");
    const { error } = await supabase.from("processo_execucoes").insert({
      processo_id: processoId,
      numero: proximoNumero,
      quantidade: Number(novaQuantidade),
      unidade: novaUnidade || null,
      data_prevista: novaData || null,
    });
    setCarregando(null);
    if (error) {
      setErro(error.message);
      return;
    }
    setNovo(false);
    setNovaQuantidade("");
    setNovaUnidade("");
    setNovaData("");
    router.refresh();
  }

  return (
    <section style={{ marginTop: 16 }}>
      <strong>Cronograma de entregas</strong>

      {erro && <p style={{ color: "#B0655C" }}>{erro}</p>}

      <table style={{ width: "100%", marginTop: 8, borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
            <th style={{ padding: 6 }}>Execução</th>
            <th style={{ padding: 6 }}>Quantidade</th>
            <th style={{ padding: 6 }}>Unidade</th>
            <th style={{ padding: 6 }}>Data prevista</th>
            <th style={{ padding: 6 }}>Situação</th>
            <th style={{ padding: 6 }}></th>
          </tr>
        </thead>
        <tbody>
          {execucoes.map((e) => (
            <tr key={e.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: 6 }}>{e.numero}</td>
              <td style={{ padding: 6 }}>{e.quantidade}</td>
              <td style={{ padding: 6 }}>{e.unidade ?? "—"}</td>
              <td style={{ padding: 6 }}>
                {e.data_prevista ? new Date(`${e.data_prevista}T00:00:00`).toLocaleDateString("pt-BR") : "—"}
              </td>
              <td style={{ padding: 6 }}>
                <select
                  value={e.situacao}
                  onChange={(ev) => atualizarSituacao(e.id, ev.target.value)}
                  disabled={carregando === e.id}
                  style={{ padding: 4 }}
                >
                  {SITUACOES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </td>
              <td style={{ padding: 6 }}>
                <button onClick={() => remover(e.id)} disabled={carregando === e.id}>
                  remover
                </button>
              </td>
            </tr>
          ))}
          {execucoes.length === 0 && !novo && (
            <tr>
              <td colSpan={6} style={{ padding: 6, color: "#7D7979" }}>
                Nenhuma entrega cadastrada.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {novo ? (
        <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "#7D7979" }}>Execução {proximoNumero}</span>
          <input
            type="number"
            step="0.001"
            placeholder="Quantidade"
            value={novaQuantidade}
            onChange={(e) => setNovaQuantidade(e.target.value)}
            style={{ padding: 6, width: 100 }}
          />
          <input
            placeholder="Unidade"
            value={novaUnidade}
            onChange={(e) => setNovaUnidade(e.target.value)}
            style={{ padding: 6, width: 100 }}
          />
          <input
            type="date"
            value={novaData}
            onChange={(e) => setNovaData(e.target.value)}
            style={{ padding: 6 }}
          />
          <button onClick={adicionar} disabled={carregando === "novo" || !novaQuantidade}>
            Salvar
          </button>
          <button onClick={() => setNovo(false)} disabled={carregando === "novo"}>
            Cancelar
          </button>
        </div>
      ) : (
        <button onClick={() => setNovo(true)} style={{ marginTop: 8 }}>
          + Adicionar entrega
        </button>
      )}
    </section>
  );
}
