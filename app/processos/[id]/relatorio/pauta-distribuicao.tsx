"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Item = {
  id: string;
  uf: string;
  quantidade: number;
  data_entrega: string | null;
  execucao_id: string | null;
};
type ExecucaoOpcao = { id: string; numero: number };

const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
  "Almoxarifado MS",
];

function formatarData(data: string | null) {
  return data ? new Date(`${data}T00:00:00`).toLocaleDateString("pt-BR") : "—";
}

export default function PautaDistribuicao({
  processoId,
  pauta,
  execucoes,
}: {
  processoId: string;
  pauta: Item[];
  execucoes: ExecucaoOpcao[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState<string | null>(null);
  const [novo, setNovo] = useState(false);
  const [novaUf, setNovaUf] = useState("");
  const [novaQuantidade, setNovaQuantidade] = useState("");
  const [novaData, setNovaData] = useState("");
  const [novaExecucaoId, setNovaExecucaoId] = useState("");

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [edicaoUf, setEdicaoUf] = useState("");
  const [edicaoQuantidade, setEdicaoQuantidade] = useState("");
  const [edicaoData, setEdicaoData] = useState("");
  const [edicaoExecucaoId, setEdicaoExecucaoId] = useState("");

  const total = pauta.reduce((soma, p) => soma + Number(p.quantidade), 0);
  const formaEntrega = pauta.length > 1 ? "Descentralizada" : pauta.length === 1 ? "Centralizada" : "não definida";

  const execucoesOrdenadas = [...execucoes].sort((a, b) => a.numero - b.numero);

  // Agrupa as linhas por parcela do Cronograma, na ordem das parcelas, com
  // "Sem parcela vinculada" por último — só pra quem ainda não linkou.
  const grupos: { execucaoId: string | null; rotulo: string; itens: Item[] }[] = [
    ...execucoesOrdenadas.map((exec) => ({
      execucaoId: exec.id,
      rotulo: `${exec.numero}ª Parcela`,
      itens: pauta.filter((p) => p.execucao_id === exec.id),
    })),
    { execucaoId: null, rotulo: "Sem parcela vinculada", itens: pauta.filter((p) => !p.execucao_id) },
  ].filter((g) => g.itens.length > 0);

  async function adicionar() {
    if (!novaUf || !novaQuantidade) return;
    setErro(null);
    setCarregando("novo");
    const { error } = await supabase.from("processo_pauta_distribuicao").insert({
      processo_id: processoId,
      uf: novaUf,
      quantidade: Number(novaQuantidade),
      data_entrega: novaData || null,
      execucao_id: novaExecucaoId || null,
    });
    setCarregando(null);
    if (error) {
      setErro(error.message);
      return;
    }
    setNovo(false);
    setNovaUf("");
    setNovaQuantidade("");
    setNovaData("");
    setNovaExecucaoId("");
    router.refresh();
  }

  async function remover(id: string) {
    setErro(null);
    setCarregando(id);
    const { error } = await supabase.from("processo_pauta_distribuicao").delete().eq("id", id);
    setCarregando(null);
    if (error) {
      setErro(error.message);
      return;
    }
    router.refresh();
  }

  function abrirEdicao(p: Item) {
    setEditandoId(p.id);
    setEdicaoUf(p.uf);
    setEdicaoQuantidade(String(p.quantidade));
    setEdicaoData(p.data_entrega ?? "");
    setEdicaoExecucaoId(p.execucao_id ?? "");
    setErro(null);
  }

  async function salvarEdicao(id: string) {
    if (!edicaoUf || !edicaoQuantidade) return;
    setErro(null);
    setCarregando(id);
    const { error } = await supabase
      .from("processo_pauta_distribuicao")
      .update({
        uf: edicaoUf,
        quantidade: Number(edicaoQuantidade),
        data_entrega: edicaoData || null,
        execucao_id: edicaoExecucaoId || null,
      })
      .eq("id", id);
    setCarregando(null);
    if (error) {
      setErro(error.message);
      return;
    }
    setEditandoId(null);
    router.refresh();
  }

  function SeletorParcela({ valor, onChange }: { valor: string; onChange: (v: string) => void }) {
    return (
      <select value={valor} onChange={(e) => onChange(e.target.value)} style={{ padding: 6 }}>
        <option value="">Sem parcela</option>
        {execucoesOrdenadas.map((e) => (
          <option key={e.id} value={e.id}>
            {e.numero}ª Parcela
          </option>
        ))}
      </select>
    );
  }

  return (
    <div style={{ marginTop: 8 }}>
      <strong style={{ fontSize: 13 }}>Pauta de distribuição</strong>
      <p style={{ fontSize: 12, color: "#7D7979", margin: "2px 0 8px" }}>
        Forma de entrega: {formaEntrega}
      </p>

      {erro && <p style={{ color: "#B0655C" }}>{erro}</p>}

      {grupos.map((grupo) => (
        <div key={grupo.execucaoId ?? "sem-parcela"} style={{ marginBottom: 10 }}>
          <span style={{ fontSize: 11.5, fontWeight: 600, color: "#7D7979" }}>{grupo.rotulo}</span>
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 4 }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
                <th style={{ padding: 6 }}>UF de destino</th>
                <th style={{ padding: 6 }}>Quantidade</th>
                <th style={{ padding: 6 }}>Data de entrega</th>
                <th style={{ padding: 6 }}></th>
              </tr>
            </thead>
            <tbody>
              {grupo.itens.map((p) =>
                editandoId === p.id ? (
                  <tr key={p.id} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: 6 }}>
                      <select value={edicaoUf} onChange={(e) => setEdicaoUf(e.target.value)} style={{ padding: 4 }}>
                        {UFS.map((uf) => (
                          <option key={uf} value={uf}>
                            {uf}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding: 6 }}>
                      <input
                        type="number"
                        step="0.001"
                        value={edicaoQuantidade}
                        onChange={(e) => setEdicaoQuantidade(e.target.value)}
                        style={{ padding: 4, width: 90 }}
                      />
                    </td>
                    <td style={{ padding: 6 }}>
                      <input
                        type="date"
                        value={edicaoData}
                        onChange={(e) => setEdicaoData(e.target.value)}
                        style={{ padding: 4 }}
                      />
                    </td>
                    <td style={{ padding: 6, display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                      <SeletorParcela valor={edicaoExecucaoId} onChange={setEdicaoExecucaoId} />
                      <button onClick={() => salvarEdicao(p.id)} disabled={carregando === p.id || !edicaoUf || !edicaoQuantidade}>
                        Salvar
                      </button>
                      <button onClick={() => setEditandoId(null)} disabled={carregando === p.id}>
                        Cancelar
                      </button>
                    </td>
                  </tr>
                ) : (
                  <tr key={p.id} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: 6 }}>{p.uf}</td>
                    <td style={{ padding: 6 }}>{p.quantidade}</td>
                    <td style={{ padding: 6 }}>{formatarData(p.data_entrega)}</td>
                    <td style={{ padding: 6, display: "flex", gap: 6 }}>
                      <button onClick={() => abrirEdicao(p)} disabled={carregando === p.id}>
                        editar
                      </button>
                      <button onClick={() => remover(p.id)} disabled={carregando === p.id}>
                        remover
                      </button>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      ))}

      {pauta.length === 0 && (
        <p style={{ fontSize: 12.5, color: "#7D7979" }}>Nenhuma UF cadastrada.</p>
      )}
      {pauta.length > 0 && (
        <p style={{ fontSize: 12.5, fontWeight: 600, textAlign: "right", margin: "4px 0 0" }}>Total: {total}</p>
      )}

      {novo ? (
        <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center", flexWrap: "wrap" }}>
          <select value={novaUf} onChange={(e) => setNovaUf(e.target.value)} style={{ padding: 6 }}>
            <option value="">UF</option>
            {UFS.map((uf) => (
              <option key={uf} value={uf}>
                {uf}
              </option>
            ))}
          </select>
          <input
            type="number"
            step="0.001"
            placeholder="Quantidade"
            value={novaQuantidade}
            onChange={(e) => setNovaQuantidade(e.target.value)}
            style={{ padding: 6, width: 100 }}
          />
          <input
            type="date"
            value={novaData}
            onChange={(e) => setNovaData(e.target.value)}
            style={{ padding: 6 }}
          />
          <SeletorParcela valor={novaExecucaoId} onChange={setNovaExecucaoId} />
          <button onClick={adicionar} disabled={carregando === "novo" || !novaUf || !novaQuantidade}>
            Salvar
          </button>
          <button onClick={() => setNovo(false)} disabled={carregando === "novo"}>
            Cancelar
          </button>
        </div>
      ) : (
        <button onClick={() => setNovo(true)} style={{ marginTop: 8 }}>
          + Adicionar à pauta
        </button>
      )}
    </div>
  );
}
