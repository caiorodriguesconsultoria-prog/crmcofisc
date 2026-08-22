"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Item = { id: string; uf: string; quantidade: number };

const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
  "Almoxarifado MS",
];

export default function PautaDistribuicao({ processoId, pauta }: { processoId: string; pauta: Item[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState<string | null>(null);
  const [novo, setNovo] = useState(false);
  const [novaUf, setNovaUf] = useState("");
  const [novaQuantidade, setNovaQuantidade] = useState("");

  const total = pauta.reduce((soma, p) => soma + Number(p.quantidade), 0);
  const formaEntrega = pauta.length > 1 ? "Descentralizada" : pauta.length === 1 ? "Centralizada" : "não definida";

  async function adicionar() {
    if (!novaUf || !novaQuantidade) return;
    setErro(null);
    setCarregando("novo");
    const { error } = await supabase.from("processo_pauta_distribuicao").insert({
      processo_id: processoId,
      uf: novaUf,
      quantidade: Number(novaQuantidade),
    });
    setCarregando(null);
    if (error) {
      setErro(error.message);
      return;
    }
    setNovo(false);
    setNovaUf("");
    setNovaQuantidade("");
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

  return (
    <div style={{ marginTop: 16 }}>
      <strong>Pauta de distribuição</strong>
      <p style={{ fontSize: 12, color: "#7D7979", margin: "2px 0 8px" }}>
        Forma de entrega: {formaEntrega}
      </p>

      {erro && <p style={{ color: "#B0655C" }}>{erro}</p>}

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
            <th style={{ padding: 6 }}>UF de destino</th>
            <th style={{ padding: 6 }}>Quantidade</th>
            <th style={{ padding: 6 }}></th>
          </tr>
        </thead>
        <tbody>
          {pauta.map((p) => (
            <tr key={p.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: 6 }}>{p.uf}</td>
              <td style={{ padding: 6 }}>{p.quantidade}</td>
              <td style={{ padding: 6 }}>
                <button onClick={() => remover(p.id)} disabled={carregando === p.id}>
                  remover
                </button>
              </td>
            </tr>
          ))}
          {pauta.length === 0 && (
            <tr>
              <td colSpan={3} style={{ padding: 6, color: "#7D7979" }}>
                Nenhuma UF cadastrada.
              </td>
            </tr>
          )}
          {pauta.length > 0 && (
            <tr style={{ fontWeight: "bold", borderTop: "1px solid #ddd" }}>
              <td style={{ padding: 6 }}>Total</td>
              <td style={{ padding: 6 }}>{total}</td>
              <td style={{ padding: 6 }}></td>
            </tr>
          )}
        </tbody>
      </table>

      {novo ? (
        <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
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
