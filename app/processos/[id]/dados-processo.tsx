"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import CartaoColapsavel from "@/app/_ui/cartao-colapsavel";
import { LinhaChave } from "@/app/_ui/campo";
import { cor } from "@/lib/theme";

function formatarData(data: string | null) {
  return data ? new Date(`${data}T00:00:00`).toLocaleDateString("pt-BR") : "não informado";
}

function formatarMoeda(valor: number | null) {
  return valor != null ? valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "não informado";
}

type Coordenacao = { id: string; sigla: string };

export default function DadosProcesso({
  processoId,
  coordenacaoId,
  coordenacaoSigla,
  coordenacoes,
  quantidadeContratada,
  numeroExecucoes,
  dataAssinatura,
  vigenciaInicio,
  vigenciaFim,
  formaEntrega,
  naturezaDespesa,
  valorGlobal,
}: {
  processoId: string;
  coordenacaoId: string | null;
  coordenacaoSigla: string;
  coordenacoes: Coordenacao[];
  quantidadeContratada: string | null;
  numeroExecucoes: number;
  dataAssinatura: string | null;
  vigenciaInicio: string | null;
  vigenciaFim: string | null;
  formaEntrega: string;
  naturezaDespesa: string | null;
  valorGlobal: number | null;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [editando, setEditando] = useState(false);
  const [novaCoordenacaoId, setNovaCoordenacaoId] = useState(coordenacaoId ?? "");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function salvarCoordenacao() {
    if (!novaCoordenacaoId) return;
    setErro(null);
    setSalvando(true);
    const { error } = await supabase
      .from("processos")
      .update({ coordenacao_id: novaCoordenacaoId })
      .eq("id", processoId);
    setSalvando(false);
    if (error) {
      setErro(error.message);
      return;
    }
    setEditando(false);
    router.refresh();
  }

  return (
    <CartaoColapsavel titulo="Dados do Processo">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          padding: "7px 0",
          borderBottom: `1px solid ${cor.borda}`,
          fontSize: 12.5,
        }}
      >
        <span style={{ color: cor.textoTerciario, flex: "none" }}>Coordenação</span>
        {editando ? (
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <select
              value={novaCoordenacaoId}
              onChange={(e) => setNovaCoordenacaoId(e.target.value)}
              style={{ padding: 5, fontSize: 12 }}
            >
              {coordenacoes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.sigla}
                </option>
              ))}
            </select>
            <button onClick={salvarCoordenacao} disabled={salvando} style={{ fontSize: 10.5, padding: "4px 8px" }}>
              Salvar
            </button>
            <button onClick={() => setEditando(false)} disabled={salvando} style={{ fontSize: 10.5, padding: "4px 8px" }}>
              X
            </button>
          </div>
        ) : (
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 600 }}>
            {coordenacaoSigla || "não informado"}
            <button onClick={() => setEditando(true)} style={{ fontSize: 10, padding: "2px 6px" }}>
              editar
            </button>
          </span>
        )}
      </div>
      {erro && <p style={{ color: cor.urgente, margin: "4px 0 0", fontSize: 12 }}>{erro}</p>}

      <LinhaChave label="Quantidade total" valor={quantidadeContratada ?? "não informado"} />
      <LinhaChave label="Nº de execuções" valor={String(numeroExecucoes)} />
      <LinhaChave label="Assinatura do contrato" valor={formatarData(dataAssinatura)} />
      <LinhaChave label="Vigência" valor={`${formatarData(vigenciaInicio)} a ${formatarData(vigenciaFim)}`} />
      <LinhaChave label="Forma de entrega" valor={formaEntrega} />
      <LinhaChave label="Natureza de despesa" valor={naturezaDespesa ?? "não informado"} />
      <LinhaChave label="Valor global" valor={formatarMoeda(valorGlobal)} />
    </CartaoColapsavel>
  );
}
