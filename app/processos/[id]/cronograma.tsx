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
  data_entrega: string | null;
  situacao: string;
};

const SITUACOES = ["pendente", "em_transito", "entregue", "atrasada"];

function calcularAtraso(dataPrevista: string | null, dataEntrega: string | null) {
  if (!dataPrevista || !dataEntrega) return null;
  const diffMs = new Date(`${dataEntrega}T00:00:00`).getTime() - new Date(`${dataPrevista}T00:00:00`).getTime();
  const diffDias = Math.round(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDias);
}

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
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [edicao, setEdicao] = useState<{
    quantidade: string;
    unidade: string;
    data_prevista: string;
    data_entrega: string;
  } | null>(null);
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

  function abrirEdicao(e: Execucao) {
    setEditandoId(e.id);
    setEdicao({
      quantidade: e.quantidade.toString(),
      unidade: e.unidade ?? "",
      data_prevista: e.data_prevista ?? "",
      data_entrega: e.data_entrega ?? "",
    });
  }

  async function salvarEdicao(execucaoId: string) {
    if (!edicao) return;
    setErro(null);
    setCarregando(execucaoId);
    const { error } = await supabase
      .from("processo_execucoes")
      .update({
        quantidade: Number(edicao.quantidade),
        unidade: edicao.unidade || null,
        data_prevista: edicao.data_prevista || null,
        data_entrega: edicao.data_entrega || null,
      })
      .eq("id", execucaoId);
    setCarregando(null);
    if (error) {
      setErro(error.message);
      return;
    }
    setEditandoId(null);
    setEdicao(null);
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

      <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", marginTop: 8, borderCollapse: "collapse", minWidth: 720 }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
            <th style={{ padding: 6 }}>Execução</th>
            <th style={{ padding: 6 }}>Quantidade</th>
            <th style={{ padding: 6 }}>Unidade</th>
            <th style={{ padding: 6 }}>Data prevista</th>
            <th style={{ padding: 6 }}>Data entregue</th>
            <th style={{ padding: 6 }}>Atraso (dias)</th>
            <th style={{ padding: 6 }}>Situação</th>
            <th style={{ padding: 6 }}></th>
          </tr>
        </thead>
        <tbody>
          {execucoes.map((e) => {
            const editando = editandoId === e.id;
            const atraso = calcularAtraso(e.data_prevista, e.data_entrega);
            return (
              <tr key={e.id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: 6 }}>{e.numero}</td>
                {editando && edicao ? (
                  <>
                    <td style={{ padding: 6 }}>
                      <input
                        type="number"
                        step="0.001"
                        value={edicao.quantidade}
                        onChange={(ev) => setEdicao({ ...edicao, quantidade: ev.target.value })}
                        style={{ width: 80, padding: 4 }}
                      />
                    </td>
                    <td style={{ padding: 6 }}>
                      <input
                        value={edicao.unidade}
                        onChange={(ev) => setEdicao({ ...edicao, unidade: ev.target.value })}
                        style={{ width: 80, padding: 4 }}
                      />
                    </td>
                    <td style={{ padding: 6 }}>
                      <input
                        type="date"
                        value={edicao.data_prevista}
                        onChange={(ev) => setEdicao({ ...edicao, data_prevista: ev.target.value })}
                        style={{ padding: 4 }}
                      />
                    </td>
                    <td style={{ padding: 6 }}>
                      <input
                        type="date"
                        value={edicao.data_entrega}
                        onChange={(ev) => setEdicao({ ...edicao, data_entrega: ev.target.value })}
                        style={{ padding: 4 }}
                      />
                    </td>
                    <td style={{ padding: 6 }}>{atraso ?? "—"}</td>
                    <td style={{ padding: 6 }}>{e.situacao}</td>
                    <td style={{ padding: 6, display: "flex", gap: 4 }}>
                      <button onClick={() => salvarEdicao(e.id)} disabled={carregando === e.id}>
                        Salvar
                      </button>
                      <button
                        onClick={() => {
                          setEditandoId(null);
                          setEdicao(null);
                        }}
                        disabled={carregando === e.id}
                      >
                        Cancelar
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td style={{ padding: 6 }}>{e.quantidade}</td>
                    <td style={{ padding: 6 }}>{e.unidade ?? "—"}</td>
                    <td style={{ padding: 6 }}>
                      {e.data_prevista ? new Date(`${e.data_prevista}T00:00:00`).toLocaleDateString("pt-BR") : "—"}
                    </td>
                    <td style={{ padding: 6 }}>
                      {e.data_entrega ? new Date(`${e.data_entrega}T00:00:00`).toLocaleDateString("pt-BR") : "—"}
                    </td>
                    <td style={{ padding: 6 }}>{atraso ?? "—"}</td>
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
                    <td style={{ padding: 6, display: "flex", gap: 4 }}>
                      <button onClick={() => abrirEdicao(e)} disabled={carregando === e.id}>
                        editar
                      </button>
                      <button onClick={() => remover(e.id)} disabled={carregando === e.id}>
                        remover
                      </button>
                    </td>
                  </>
                )}
              </tr>
            );
          })}
          {execucoes.length === 0 && !novo && (
            <tr>
              <td colSpan={8} style={{ padding: 6, color: "#7D7979" }}>
                Nenhuma entrega cadastrada.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      </div>

      {novo ? (
        <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center", flexWrap: "wrap" }}>
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
