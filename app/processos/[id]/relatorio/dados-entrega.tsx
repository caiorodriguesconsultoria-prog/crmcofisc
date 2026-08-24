"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Entrega = {
  id: string;
  local_entrega: string | null;
  quantidade: number | null;
  valor_total_nf: number | null;
  danfe_venda: string | null;
  danfe_remessa: string | null;
  lote: string | null;
  data_fabricacao: string | null;
  data_validade: string | null;
  data_entrega: string | null;
  responsavel: string | null;
  atraso_dias: number | null;
  percentual_transcurso: number | null;
};

const CAMPOS_VAZIOS = {
  local_entrega: "",
  quantidade: "",
  valor_total_nf: "",
  danfe_venda: "",
  danfe_remessa: "",
  lote: "",
  data_fabricacao: "",
  data_validade: "",
  data_entrega: "",
  responsavel: "",
  atraso_dias: "",
  percentual_transcurso: "",
};

function formatarData(data: string | null) {
  return data ? new Date(`${data}T00:00:00`).toLocaleDateString("pt-BR") : "—";
}

function formatarMoeda(valor: number | null) {
  return valor != null ? valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "—";
}

export default function DadosEntrega({ processoId, entregas }: { processoId: string; entregas: Entrega[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [carregando, setCarregando] = useState<string | null>(null);
  const [novo, setNovo] = useState(false);
  const [campos, setCampos] = useState(CAMPOS_VAZIOS);

  const totalNf = entregas.reduce((soma, e) => soma + (e.valor_total_nf ?? 0), 0);

  function atualizar(chave: keyof typeof CAMPOS_VAZIOS, valor: string) {
    setCampos((atual) => ({ ...atual, [chave]: valor }));
  }

  async function adicionar() {
    setErro(null);
    setSalvando(true);
    const { error } = await supabase.from("processo_entregas").insert({
      processo_id: processoId,
      local_entrega: campos.local_entrega || null,
      quantidade: campos.quantidade ? Number(campos.quantidade) : null,
      valor_total_nf: campos.valor_total_nf ? Number(campos.valor_total_nf) : null,
      danfe_venda: campos.danfe_venda || null,
      danfe_remessa: campos.danfe_remessa || null,
      lote: campos.lote || null,
      data_fabricacao: campos.data_fabricacao || null,
      data_validade: campos.data_validade || null,
      data_entrega: campos.data_entrega || null,
      responsavel: campos.responsavel || null,
      atraso_dias: campos.atraso_dias ? Number(campos.atraso_dias) : null,
      percentual_transcurso: campos.percentual_transcurso ? Number(campos.percentual_transcurso) : null,
    });
    setSalvando(false);
    if (error) {
      setErro(error.message);
      return;
    }
    setNovo(false);
    setCampos(CAMPOS_VAZIOS);
    router.refresh();
  }

  async function remover(id: string) {
    setErro(null);
    setCarregando(id);
    const { error } = await supabase.from("processo_entregas").delete().eq("id", id);
    setCarregando(null);
    if (error) {
      setErro(error.message);
      return;
    }
    router.refresh();
  }

  return (
    <div style={{ marginTop: 20 }}>
      <strong style={{ fontSize: 13 }}>Dados de entrega</strong>
      <p style={{ fontSize: 12, color: "#7D7979", margin: "2px 0 8px" }}>
        Atraso e % de transcurso não são calculados automaticamente — preencha manualmente.
      </p>

      {erro && <p style={{ color: "#B0655C" }}>{erro}</p>}

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
              <th style={{ padding: 6 }}>Local</th>
              <th style={{ padding: 6 }}>Qtd.</th>
              <th style={{ padding: 6 }}>Valor NF</th>
              <th style={{ padding: 6 }}>DANFE venda</th>
              <th style={{ padding: 6 }}>DANFE remessa</th>
              <th style={{ padding: 6 }}>Lote</th>
              <th style={{ padding: 6 }}>Fabricação</th>
              <th style={{ padding: 6 }}>Validade</th>
              <th style={{ padding: 6 }}>Entrega</th>
              <th style={{ padding: 6 }}>Responsável</th>
              <th style={{ padding: 6 }}>Atraso (d.)</th>
              <th style={{ padding: 6 }}>% transc.</th>
              <th style={{ padding: 6 }}></th>
            </tr>
          </thead>
          <tbody>
            {entregas.map((e) => (
              <tr key={e.id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: 6 }}>{e.local_entrega ?? "—"}</td>
                <td style={{ padding: 6 }}>{e.quantidade ?? "—"}</td>
                <td style={{ padding: 6 }}>{formatarMoeda(e.valor_total_nf)}</td>
                <td style={{ padding: 6 }}>{e.danfe_venda ?? "—"}</td>
                <td style={{ padding: 6 }}>{e.danfe_remessa ?? "—"}</td>
                <td style={{ padding: 6 }}>{e.lote ?? "—"}</td>
                <td style={{ padding: 6 }}>{formatarData(e.data_fabricacao)}</td>
                <td style={{ padding: 6 }}>{formatarData(e.data_validade)}</td>
                <td style={{ padding: 6 }}>{formatarData(e.data_entrega)}</td>
                <td style={{ padding: 6 }}>{e.responsavel ?? "—"}</td>
                <td style={{ padding: 6 }}>{e.atraso_dias ?? "—"}</td>
                <td style={{ padding: 6 }}>{e.percentual_transcurso ?? "—"}</td>
                <td style={{ padding: 6 }}>
                  <button onClick={() => remover(e.id)} disabled={carregando === e.id}>
                    remover
                  </button>
                </td>
              </tr>
            ))}
            {entregas.length === 0 && (
              <tr>
                <td colSpan={13} style={{ padding: 6, color: "#7D7979" }}>
                  Nenhuma entrega registrada.
                </td>
              </tr>
            )}
            {entregas.length > 0 && (
              <tr style={{ fontWeight: "bold", borderTop: "1px solid #ddd" }}>
                <td style={{ padding: 6 }}>TOTAL</td>
                <td style={{ padding: 6 }}></td>
                <td style={{ padding: 6 }}>{formatarMoeda(totalNf)}</td>
                <td colSpan={10} style={{ padding: 6 }}></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {novo ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
            marginTop: 8,
            padding: 8,
            background: "#F5F4F3",
          }}
        >
          <input
            placeholder="Local de entrega"
            value={campos.local_entrega}
            onChange={(e) => atualizar("local_entrega", e.target.value)}
            style={{ padding: 6 }}
          />
          <input
            type="number"
            step="0.001"
            placeholder="Quantidade"
            value={campos.quantidade}
            onChange={(e) => atualizar("quantidade", e.target.value)}
            style={{ padding: 6 }}
          />
          <input
            type="number"
            step="0.01"
            placeholder="Valor total da NF"
            value={campos.valor_total_nf}
            onChange={(e) => atualizar("valor_total_nf", e.target.value)}
            style={{ padding: 6 }}
          />
          <input
            placeholder="DANFE venda"
            value={campos.danfe_venda}
            onChange={(e) => atualizar("danfe_venda", e.target.value)}
            style={{ padding: 6 }}
          />
          <input
            placeholder="DANFE remessa"
            value={campos.danfe_remessa}
            onChange={(e) => atualizar("danfe_remessa", e.target.value)}
            style={{ padding: 6 }}
          />
          <input
            placeholder="Lote"
            value={campos.lote}
            onChange={(e) => atualizar("lote", e.target.value)}
            style={{ padding: 6 }}
          />
          <label style={{ fontSize: 12 }}>
            Data fabricação
            <input
              type="date"
              value={campos.data_fabricacao}
              onChange={(e) => atualizar("data_fabricacao", e.target.value)}
              style={{ display: "block", width: "100%", padding: 6 }}
            />
          </label>
          <label style={{ fontSize: 12 }}>
            Data validade
            <input
              type="date"
              value={campos.data_validade}
              onChange={(e) => atualizar("data_validade", e.target.value)}
              style={{ display: "block", width: "100%", padding: 6 }}
            />
          </label>
          <label style={{ fontSize: 12 }}>
            Data de entrega
            <input
              type="date"
              value={campos.data_entrega}
              onChange={(e) => atualizar("data_entrega", e.target.value)}
              style={{ display: "block", width: "100%", padding: 6 }}
            />
          </label>
          <input
            placeholder="Responsável"
            value={campos.responsavel}
            onChange={(e) => atualizar("responsavel", e.target.value)}
            style={{ padding: 6 }}
          />
          <input
            type="number"
            placeholder="Atraso (dias)"
            value={campos.atraso_dias}
            onChange={(e) => atualizar("atraso_dias", e.target.value)}
            style={{ padding: 6 }}
          />
          <input
            type="number"
            step="0.01"
            placeholder="% transcurso"
            value={campos.percentual_transcurso}
            onChange={(e) => atualizar("percentual_transcurso", e.target.value)}
            style={{ padding: 6 }}
          />
          {erro && <p style={{ color: "#B0655C", gridColumn: "1 / -1" }}>{erro}</p>}
          <div style={{ gridColumn: "1 / -1", display: "flex", gap: 8 }}>
            <button onClick={adicionar} disabled={salvando}>
              Salvar
            </button>
            <button onClick={() => setNovo(false)} disabled={salvando}>
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setNovo(true)} style={{ marginTop: 8 }}>
          + Adicionar entrega
        </button>
      )}
    </div>
  );
}
