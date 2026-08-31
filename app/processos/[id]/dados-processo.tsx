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

// Data de encerramento = data de assinatura + a mesma duração entre início
// e fim de vigência — cruzamento independente do que foi digitado em
// Vigência Fim, útil quando a vigência não começa exatamente na assinatura.
function calcularEncerramento(dataAssinatura: string | null, vigenciaInicio: string | null, vigenciaFim: string | null) {
  if (!dataAssinatura || !vigenciaInicio || !vigenciaFim) return null;
  const inicio = new Date(`${vigenciaInicio}T00:00:00`).getTime();
  const fim = new Date(`${vigenciaFim}T00:00:00`).getTime();
  const assinatura = new Date(`${dataAssinatura}T00:00:00`).getTime();
  const duracaoMs = fim - inicio;
  if (duracaoMs < 0) return null;
  return new Date(assinatura + duracaoMs).toISOString().slice(0, 10);
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
  unidadeMedida,
  execucaoForma,
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
  unidadeMedida: string | null;
  execucaoForma: string | null;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [editando, setEditando] = useState(false);
  const [novaCoordenacaoId, setNovaCoordenacaoId] = useState(coordenacaoId ?? "");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [editandoDados, setEditandoDados] = useState(false);
  const [valores, setValores] = useState({
    quantidade_contratada: quantidadeContratada ?? "",
    data_assinatura: dataAssinatura ?? "",
    vigencia_inicio: vigenciaInicio ?? "",
    vigencia_fim: vigenciaFim ?? "",
    natureza_despesa: naturezaDespesa ?? "",
    valor_global: valorGlobal?.toString() ?? "",
    unidade_medida: unidadeMedida ?? "",
    execucao_forma: execucaoForma ?? "",
  });
  const [salvandoDados, setSalvandoDados] = useState(false);
  const [erroDados, setErroDados] = useState<string | null>(null);

  const encerramento = calcularEncerramento(dataAssinatura, vigenciaInicio, vigenciaFim);

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

  function abrirEdicaoDados() {
    setValores({
      quantidade_contratada: quantidadeContratada ?? "",
      data_assinatura: dataAssinatura ?? "",
      vigencia_inicio: vigenciaInicio ?? "",
      vigencia_fim: vigenciaFim ?? "",
      natureza_despesa: naturezaDespesa ?? "",
      valor_global: valorGlobal?.toString() ?? "",
      unidade_medida: unidadeMedida ?? "",
      execucao_forma: execucaoForma ?? "",
    });
    setErroDados(null);
    setEditandoDados(true);
  }

  async function salvarDados() {
    setErroDados(null);
    setSalvandoDados(true);
    const { error } = await supabase
      .from("processos")
      .update({
        quantidade_contratada: valores.quantidade_contratada || null,
        data_assinatura: valores.data_assinatura || null,
        vigencia_inicio: valores.vigencia_inicio || null,
        vigencia_fim: valores.vigencia_fim || null,
        natureza_despesa: valores.natureza_despesa || null,
        valor_global: valores.valor_global ? Number(valores.valor_global) : null,
        unidade_medida: valores.unidade_medida || null,
        execucao_forma: valores.execucao_forma || null,
      })
      .eq("id", processoId);
    setSalvandoDados(false);
    if (error) {
      setErroDados(error.message);
      return;
    }
    setEditandoDados(false);
    router.refresh();
  }

  return (
    <CartaoColapsavel titulo="Dados do Processo" abertoInicial={false}>
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

      <div style={{ display: "flex", justifyContent: "flex-end", padding: "8px 0 2px" }}>
        {!editandoDados ? (
          <button onClick={abrirEdicaoDados} style={{ fontSize: 10.5, padding: "4px 8px" }}>
            editar dados
          </button>
        ) : (
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={salvarDados} disabled={salvandoDados} style={{ fontSize: 10.5, padding: "4px 8px" }}>
              {salvandoDados ? "Salvando..." : "Salvar"}
            </button>
            <button onClick={() => setEditandoDados(false)} disabled={salvandoDados} style={{ fontSize: 10.5, padding: "4px 8px" }}>
              Cancelar
            </button>
          </div>
        )}
      </div>
      {erroDados && <p style={{ color: cor.urgente, margin: "0 0 4px", fontSize: 12 }}>{erroDados}</p>}

      {!editandoDados ? (
        <>
          <LinhaChave label="Quantidade total" valor={quantidadeContratada ?? "não informado"} />
          <LinhaChave label="Unidade de medida" valor={unidadeMedida ?? "não informado"} />
          <LinhaChave label="Nº de execuções" valor={String(numeroExecucoes)} />
          <LinhaChave label="Assinatura do contrato" valor={formatarData(dataAssinatura)} />
          <LinhaChave label="Vigência" valor={`${formatarData(vigenciaInicio)} a ${formatarData(vigenciaFim)}`} />
          <LinhaChave label="Data de encerramento" valor={formatarData(encerramento)} />
          <LinhaChave label="Forma de entrega" valor={formaEntrega} />
          <LinhaChave label="Execução" valor={execucaoForma ?? "não informado"} />
          <LinhaChave label="Natureza de despesa" valor={naturezaDespesa ?? "não informado"} />
          <LinhaChave label="Valor global" valor={formatarMoeda(valorGlobal)} />
        </>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, padding: "6px 0" }}>
          <label style={{ fontSize: 11 }}>
            Quantidade total
            <input
              value={valores.quantidade_contratada}
              onChange={(e) => setValores((v) => ({ ...v, quantidade_contratada: e.target.value }))}
              style={{ display: "block", width: "100%", padding: 6, marginTop: 2 }}
            />
          </label>
          <label style={{ fontSize: 11 }}>
            Unidade de medida
            <input
              value={valores.unidade_medida}
              onChange={(e) => setValores((v) => ({ ...v, unidade_medida: e.target.value }))}
              placeholder="ex.: frascos, caixas"
              style={{ display: "block", width: "100%", padding: 6, marginTop: 2 }}
            />
          </label>
          <label style={{ fontSize: 11 }}>
            Assinatura do contrato
            <input
              type="date"
              value={valores.data_assinatura}
              onChange={(e) => setValores((v) => ({ ...v, data_assinatura: e.target.value }))}
              style={{ display: "block", width: "100%", padding: 6, marginTop: 2 }}
            />
          </label>
          <label style={{ fontSize: 11 }}>
            Vigência início
            <input
              type="date"
              value={valores.vigencia_inicio}
              onChange={(e) => setValores((v) => ({ ...v, vigencia_inicio: e.target.value }))}
              style={{ display: "block", width: "100%", padding: 6, marginTop: 2 }}
            />
          </label>
          <label style={{ fontSize: 11 }}>
            Vigência fim
            <input
              type="date"
              value={valores.vigencia_fim}
              onChange={(e) => setValores((v) => ({ ...v, vigencia_fim: e.target.value }))}
              style={{ display: "block", width: "100%", padding: 6, marginTop: 2 }}
            />
          </label>
          <label style={{ fontSize: 11 }}>
            Execução
            <select
              value={valores.execucao_forma}
              onChange={(e) => setValores((v) => ({ ...v, execucao_forma: e.target.value }))}
              style={{ display: "block", width: "100%", padding: 6, marginTop: 2 }}
            >
              <option value="">Não informado</option>
              <option value="Centralizada">Centralizada</option>
              <option value="Descentralizada">Descentralizada</option>
            </select>
          </label>
          <label style={{ fontSize: 11 }}>
            Natureza de despesa
            <input
              value={valores.natureza_despesa}
              onChange={(e) => setValores((v) => ({ ...v, natureza_despesa: e.target.value }))}
              style={{ display: "block", width: "100%", padding: 6, marginTop: 2 }}
            />
          </label>
          <label style={{ fontSize: 11 }}>
            Valor global
            <input
              type="number"
              step="0.01"
              value={valores.valor_global}
              onChange={(e) => setValores((v) => ({ ...v, valor_global: e.target.value }))}
              style={{ display: "block", width: "100%", padding: 6, marginTop: 2 }}
            />
          </label>
        </div>
      )}
    </CartaoColapsavel>
  );
}
