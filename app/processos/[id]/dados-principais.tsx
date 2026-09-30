"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { card, cor } from "@/lib/theme";
import { BotaoCopiar } from "@/app/_ui/campo";

type Nup = { id: string; tipo: "relatorio" | "pagamento"; valor: string };
type ParNup = {
  execucaoId: string;
  numero: number;
  pagamento: { id: string; valor: string };
};
type ExecucaoOpcao = { id: string; numero: number };

function Coluna({ label, valor, acao }: { label: string; valor: string; acao?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
      <span
        style={{
          fontSize: 10.5,
          fontWeight: 500,
          textTransform: "uppercase",
          letterSpacing: 1,
          color: cor.textoTerciario,
        }}
      >
        {label}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 600 }}>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{valor}</span>
        <BotaoCopiar texto={valor} />
        {acao}
      </div>
    </div>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: 11, minWidth: 0 }}>
      <span style={{ textTransform: "uppercase", letterSpacing: 1, fontSize: 10.5, color: cor.textoTerciario }}>
        {label}
      </span>
      {children}
    </label>
  );
}

export default function DadosPrincipais({
  processoId,
  nupPrincipal,
  nupRelatorio,
  paresNup,
  execucoesSemPar,
  totalExecucoes,
  fornecedorNome,
  cnpj,
  objeto,
  unidadeMedida,
  responsavelPagamentoNome,
  responsavelPagamentoEmail,
}: {
  processoId: string;
  nupPrincipal: string;
  nupRelatorio: Nup | null;
  paresNup: ParNup[];
  execucoesSemPar: ExecucaoOpcao[];
  totalExecucoes: number;
  fornecedorNome: string;
  cnpj: string;
  objeto: string;
  unidadeMedida: string | null;
  responsavelPagamentoNome: string | null;
  responsavelPagamentoEmail: string | null;
}) {
  const router = useRouter();
  const supabase = createClient();

  // Um único botão de edição pro card inteiro — antes cada campo (NUP
  // Relatório, Unidade de medida, Responsável pelo pagamento) tinha seu
  // próprio "editar" solto, ficava trabalhoso corrigir mais de um campo.
  const [editandoTudo, setEditandoTudo] = useState(false);
  const [valores, setValores] = useState({
    nup_principal: nupPrincipal,
    nup_relatorio: nupRelatorio?.valor ?? "",
    objeto,
    unidade_medida: unidadeMedida ?? "",
    responsavel_pagamento_nome: responsavelPagamentoNome ?? "",
    responsavel_pagamento_email: responsavelPagamentoEmail ?? "",
  });
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  // Edição de um NUP de parcela (pagamento) — identificado pelo id da linha
  // em processo_nups, que já existe desde a criação do par.
  const [editandoNupId, setEditandoNupId] = useState<string | null>(null);
  const [valorNup, setValorNup] = useState("");
  const [salvandoNup, setSalvandoNup] = useState(false);

  const [criandoPar, setCriandoPar] = useState(false);
  const [execucaoEscolhida, setExecucaoEscolhida] = useState("");
  const [salvandoPar, setSalvandoPar] = useState(false);

  function abrirEdicaoTudo() {
    setValores({
      nup_principal: nupPrincipal,
      nup_relatorio: nupRelatorio?.valor ?? "",
      objeto,
      unidade_medida: unidadeMedida ?? "",
      responsavel_pagamento_nome: responsavelPagamentoNome ?? "",
      responsavel_pagamento_email: responsavelPagamentoEmail ?? "",
    });
    setErro(null);
    setEditandoTudo(true);
  }

  async function salvarTudo() {
    setErro(null);
    if (!valores.nup_principal.trim() || !valores.objeto.trim()) {
      setErro("NUP Principal e Objeto não podem ficar em branco.");
      return;
    }
    setSalvando(true);

    const { error: erroProcesso } = await supabase
      .from("processos")
      .update({
        nup_principal: valores.nup_principal.trim(),
        objeto: valores.objeto.trim(),
        unidade_medida: valores.unidade_medida.trim() || null,
        responsavel_pagamento_nome: valores.responsavel_pagamento_nome.trim() || null,
        responsavel_pagamento_email: valores.responsavel_pagamento_email.trim() || null,
      })
      .eq("id", processoId);
    if (erroProcesso) {
      setSalvando(false);
      setErro(erroProcesso.message);
      return;
    }

    const nupRelatorioValor = valores.nup_relatorio.trim();
    const { error: erroNup } = nupRelatorio
      ? await supabase.from("processo_nups").update({ nup: nupRelatorioValor || null }).eq("id", nupRelatorio.id)
      : nupRelatorioValor
        ? await supabase
            .from("processo_nups")
            .insert({ processo_id: processoId, tipo: "relatorio", nup: nupRelatorioValor })
        : { error: null };
    setSalvando(false);
    if (erroNup) {
      setErro(erroNup.message);
      return;
    }

    setEditandoTudo(false);
    router.refresh();
  }

  function abrirEdicaoNup(id: string, valorAtual: string) {
    setEditandoNupId(id);
    setValorNup(valorAtual);
    setErro(null);
  }

  async function salvarNup(id: string) {
    setErro(null);
    setSalvandoNup(true);
    const { error } = await supabase.from("processo_nups").update({ nup: valorNup.trim() || null }).eq("id", id);
    setSalvandoNup(false);
    if (error) {
      setErro(error.message);
      return;
    }
    setEditandoNupId(null);
    router.refresh();
  }

  async function criarPar() {
    if (!execucaoEscolhida) return;
    setErro(null);
    setSalvandoPar(true);
    // NUP de Entrega não entra mais aqui — cada lançamento de entrega no
    // Cronograma já gera o dele automaticamente (1 por lançamento, não mais
    // 1 por parcela). Aqui só fica o de Pagamento, que continua 1 por parcela.
    const { error } = await supabase
      .from("processo_nups")
      .insert({ processo_id: processoId, tipo: "pagamento", execucao_id: execucaoEscolhida });
    setSalvandoPar(false);
    if (error) {
      setErro(error.message);
      return;
    }
    setCriandoPar(false);
    setExecucaoEscolhida("");
    router.refresh();
  }

  return (
    <div style={{ ...card, display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <span
          style={{
            fontSize: 11.5,
            fontWeight: 600,
            color: cor.destaque,
            letterSpacing: 0.6,
            textTransform: "uppercase",
          }}
        >
          Dados principais
        </span>
        {!editandoTudo ? (
          <button onClick={abrirEdicaoTudo} style={{ fontSize: 10.5, padding: "4px 8px" }}>
            editar
          </button>
        ) : (
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={salvarTudo} disabled={salvando} style={{ fontSize: 10.5, padding: "4px 8px" }}>
              {salvando ? "Salvando..." : "Salvar"}
            </button>
            <button onClick={() => setEditandoTudo(false)} disabled={salvando} style={{ fontSize: 10.5, padding: "4px 8px" }}>
              Cancelar
            </button>
          </div>
        )}
      </div>

      {erro && <p style={{ color: cor.urgente, margin: 0, fontSize: 12 }}>{erro}</p>}

      {!editandoTudo ? (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
            <Coluna label="NUP Principal" valor={nupPrincipal} />
            <Coluna label="NUP Relatório" valor={nupRelatorio?.valor ?? "não informado"} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1.6fr", gap: 14 }}>
            <Coluna label="Contratada" valor={fornecedorNome || "não informado"} />
            <Coluna label="CNPJ" valor={cnpj || "não informado"} />
            <Coluna
              label="Objeto"
              valor={objeto}
              acao={
                <BotaoCopiar
                  texto={unidadeMedida ? `${objeto}, ${unidadeMedida}` : objeto}
                  rotulo="Copiar objeto + unidade"
                />
              }
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1.6fr", gap: 14 }}>
            <div />
            <div />
            <Coluna label="Unidade de medida" valor={unidadeMedida ?? "não informado"} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.6fr", gap: 14 }}>
            <Coluna label="Responsável pelo pagamento" valor={responsavelPagamentoNome || "não informado"} />
            <Coluna label="E-mail do responsável" valor={responsavelPagamentoEmail || "não informado"} />
          </div>
        </>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
          <Campo label="NUP Principal">
            <input
              value={valores.nup_principal}
              onChange={(e) => setValores((v) => ({ ...v, nup_principal: e.target.value }))}
              style={{ padding: 6 }}
            />
          </Campo>
          <Campo label="NUP Relatório">
            <input
              value={valores.nup_relatorio}
              onChange={(e) => setValores((v) => ({ ...v, nup_relatorio: e.target.value }))}
              style={{ padding: 6 }}
            />
          </Campo>
          <Campo label="Contratada">
            <span style={{ fontSize: 12.5, fontWeight: 600, padding: "6px 0" }}>{fornecedorNome || "não informado"}</span>
          </Campo>
          <Campo label="CNPJ">
            <span style={{ fontSize: 12.5, fontWeight: 600, padding: "6px 0" }}>{cnpj || "não informado"}</span>
          </Campo>
          <Campo label="Objeto">
            <input
              value={valores.objeto}
              onChange={(e) => setValores((v) => ({ ...v, objeto: e.target.value }))}
              style={{ padding: 6 }}
            />
          </Campo>
          <Campo label="Unidade de medida">
            <input
              value={valores.unidade_medida}
              onChange={(e) => setValores((v) => ({ ...v, unidade_medida: e.target.value }))}
              placeholder="ex.: frascos, caixas"
              style={{ padding: 6 }}
            />
          </Campo>
          <Campo label="Responsável pelo pagamento">
            <input
              value={valores.responsavel_pagamento_nome}
              onChange={(e) => setValores((v) => ({ ...v, responsavel_pagamento_nome: e.target.value }))}
              placeholder="Nome do responsável"
              style={{ padding: 6 }}
            />
          </Campo>
          <Campo label="E-mail do responsável">
            <input
              value={valores.responsavel_pagamento_email}
              onChange={(e) => setValores((v) => ({ ...v, responsavel_pagamento_email: e.target.value }))}
              placeholder="E-mail do responsável"
              style={{ padding: 6 }}
            />
          </Campo>
        </div>
      )}

      {/* NUP de Pagamento por parcela — ligado ao cronograma. NUP de Entrega
          fica no Cronograma, um por lançamento (entrega pode ser parcial). */}
      {paresNup.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 4, borderTop: `1px solid ${cor.borda}` }}>
          {paresNup.map((par) => {
            const linha = par.pagamento;
            const rotulo = `NUP Pagamento - ${par.numero}ª Parcela`;
            return editandoNupId === linha.id ? (
              <div key={par.execucaoId} style={{ display: "flex", gap: 6 }}>
                <input
                  autoFocus
                  value={valorNup}
                  onChange={(e) => setValorNup(e.target.value)}
                  style={{ flex: 1, padding: 6 }}
                />
                <button onClick={() => salvarNup(linha.id)} disabled={salvandoNup} style={{ fontSize: 11 }}>
                  Salvar
                </button>
                <button onClick={() => setEditandoNupId(null)} disabled={salvandoNup} style={{ fontSize: 11 }}>
                  X
                </button>
              </div>
            ) : (
              <Coluna
                key={par.execucaoId}
                label={rotulo}
                valor={linha.valor || "não informado"}
                acao={
                  <button
                    onClick={() => abrirEdicaoNup(linha.id, linha.valor)}
                    style={{ fontSize: 10, padding: "2px 6px" }}
                  >
                    editar
                  </button>
                }
              />
            );
          })}
        </div>
      )}

      <div>
        {criandoPar ? (
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            <select
              value={execucaoEscolhida}
              onChange={(e) => setExecucaoEscolhida(e.target.value)}
              style={{ padding: 6 }}
            >
              <option value="">Selecione a parcela</option>
              {execucoesSemPar.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.numero}ª Parcela
                </option>
              ))}
            </select>
            <button onClick={criarPar} disabled={salvandoPar || !execucaoEscolhida} style={{ fontSize: 11 }}>
              Criar
            </button>
            <button onClick={() => { setCriandoPar(false); setExecucaoEscolhida(""); }} disabled={salvandoPar} style={{ fontSize: 11 }}>
              Cancelar
            </button>
          </div>
        ) : (
          <button
            onClick={() => setCriandoPar(true)}
            disabled={execucoesSemPar.length === 0}
            style={{ fontSize: 11.5 }}
            title={
              execucoesSemPar.length > 0
                ? undefined
                : totalExecucoes === 0
                  ? "Cadastre uma parcela no Cronograma primeiro"
                  : "Todas as parcelas já têm NUP de Pagamento"
            }
          >
            + Criar NUP de Pagamento
          </button>
        )}
      </div>
    </div>
  );
}
