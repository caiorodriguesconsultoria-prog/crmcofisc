"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { card, cor } from "@/lib/theme";
import { BotaoCopiar } from "@/app/_ui/campo";

type Nup = { id: string; tipo: "relatorio" | "pagamento"; valor: string };
type TipoLancamento = "total" | "parcial" | "avaria";
type LancamentoEntrega = {
  id: string;
  tipo: TipoLancamento;
  lancamento_pai_id: string | null;
  quantidade_normal: number;
  quantidade_avaria: number;
  quantidade_desvio: number;
  data_entrega: string | null;
  data_limite: string | null;
  processo_nups: { id: string; tipo: "entrega" | "pagamento"; nup: string | null }[];
};
type Execucao = {
  id: string;
  numero: number;
  processo_entrega_lancamentos: LancamentoEntrega[];
};

function formatarData(data: string | null) {
  return data ? new Date(`${data}T00:00:00`).toLocaleDateString("pt-BR") : "—";
}

function nupPorTipo(nups: LancamentoEntrega["processo_nups"], tipo: "entrega" | "pagamento") {
  return nups.find((n) => n.tipo === tipo) ?? null;
}

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
  execucoes,
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
  execucoes: Execucao[];
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

  const execucoesOrdenadas = [...execucoes].sort((a, b) => a.numero - b.numero);

  // Criação de um novo lançamento (entrega total/parcial) direto por aqui —
  // a referência da parcela + o lançamento em si (manual) nascem juntos,
  // já com os dois NUPs (entrega e pagamento) prontos pra editar na lista.
  const [criandoLancamento, setCriandoLancamento] = useState(false);
  const [execucaoEscolhida, setExecucaoEscolhida] = useState("");
  const [novoLancTipo, setNovoLancTipo] = useState<"total" | "parcial">("parcial");
  const [novoLancData, setNovoLancData] = useState("");
  const [novoLancNormal, setNovoLancNormal] = useState("");
  const [novoLancAvaria, setNovoLancAvaria] = useState("");
  const [novoLancDesvio, setNovoLancDesvio] = useState("");
  const [salvandoLancamento, setSalvandoLancamento] = useState(false);

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

  function abrirNovoLancamento() {
    setCriandoLancamento(true);
    setExecucaoEscolhida("");
    setNovoLancTipo("parcial");
    setNovoLancData("");
    setNovoLancNormal("");
    setNovoLancAvaria("");
    setNovoLancDesvio("");
    setErro(null);
  }

  // Novo lançamento (a "entrega parcial" manual que o Caio pediu) já nasce
  // com os dois slots de NUP (entrega + pagamento) — ambos 1-por-lançamento.
  async function criarLancamento() {
    const normal = Number(novoLancNormal) || 0;
    const avaria = Number(novoLancAvaria) || 0;
    const desvio = Number(novoLancDesvio) || 0;
    if (!execucaoEscolhida || !novoLancData || normal + avaria + desvio <= 0) return;
    setErro(null);
    setSalvandoLancamento(true);
    const { data: lancamento, error } = await supabase
      .from("processo_entrega_lancamentos")
      .insert({
        execucao_id: execucaoEscolhida,
        tipo: novoLancTipo,
        quantidade_normal: normal,
        quantidade_avaria: avaria,
        quantidade_desvio: desvio,
        data_entrega: novoLancData,
      })
      .select("id")
      .single();
    if (error || !lancamento) {
      setSalvandoLancamento(false);
      setErro(error?.message ?? "Não deu pra salvar o lançamento.");
      return;
    }
    await supabase.from("processo_nups").insert([
      { processo_id: processoId, tipo: "entrega", execucao_id: execucaoEscolhida, lancamento_id: lancamento.id },
      { processo_id: processoId, tipo: "pagamento", execucao_id: execucaoEscolhida, lancamento_id: lancamento.id },
    ]);
    setSalvandoLancamento(false);
    setCriandoLancamento(false);
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

      {/* NUPs de Entrega e Pagamento, por parcela — um par por lançamento
          (entrega total ou parcial), já que uma parcela pode ter várias
          entregas. Reposição de avaria fica aninhada embaixo da entrega que
          corrige, recuada à direita, sem NUP próprio (reusa o da entrega). */}
      {execucoesOrdenadas.map((exec) => {
        const lancamentosTopo = (exec.processo_entrega_lancamentos ?? []).filter((l) => l.tipo !== "avaria");
        if (lancamentosTopo.length === 0) return null;
        const avariasDe = (paiId: string) =>
          (exec.processo_entrega_lancamentos ?? []).filter((l) => l.lancamento_pai_id === paiId);
        return (
          <div key={exec.id} style={{ paddingTop: 10, borderTop: `1px solid ${cor.borda}` }}>
            <span style={{ fontSize: 12, fontWeight: 600 }}>{exec.numero}ª Parcela</span>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
              {lancamentosTopo.map((l) => {
                const nupEntrega = nupPorTipo(l.processo_nups, "entrega");
                const nupPagamento = nupPorTipo(l.processo_nups, "pagamento");
                const avarias = avariasDe(l.id);
                return (
                  <div key={l.id} style={{ marginLeft: 16, display: "flex", flexDirection: "column", gap: 6 }}>
                    <span style={{ fontSize: 10.5, color: cor.textoTerciario }}>
                      {l.tipo === "total" ? "Total" : "Parcial"} · {formatarData(l.data_entrega)} ·{" "}
                      {(l.quantidade_normal + l.quantidade_avaria + l.quantidade_desvio).toLocaleString("pt-BR")} un.
                    </span>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
                      {[
                        { rotulo: "NUP de Entrega", linha: nupEntrega },
                        { rotulo: "NUP de Pagamento", linha: nupPagamento },
                      ].map(({ rotulo, linha }) =>
                        linha && editandoNupId === linha.id ? (
                          <div key={rotulo} style={{ display: "flex", gap: 6 }}>
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
                            key={rotulo}
                            label={rotulo}
                            valor={linha?.nup || "não informado"}
                            acao={
                              linha ? (
                                <button
                                  onClick={() => abrirEdicaoNup(linha.id, linha.nup ?? "")}
                                  style={{ fontSize: 10, padding: "2px 6px" }}
                                >
                                  editar
                                </button>
                              ) : undefined
                            }
                          />
                        ),
                      )}
                    </div>
                    {avarias.length > 0 && (
                      <div style={{ marginLeft: 16, display: "flex", flexDirection: "column", gap: 3 }}>
                        {avarias.map((a) => (
                          <span key={a.id} style={{ fontSize: 11, color: cor.urgente }}>
                            Avaria — prazo: {formatarData(a.data_limite)} · quantidade: {a.quantidade_normal.toLocaleString("pt-BR")}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <div>
        {criandoLancamento ? (
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
            <select value={execucaoEscolhida} onChange={(e) => setExecucaoEscolhida(e.target.value)} style={{ padding: 6 }}>
              <option value="">Selecione a parcela</option>
              {execucoesOrdenadas.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.numero}ª Parcela
                </option>
              ))}
            </select>
            <div style={{ display: "flex", gap: 4 }}>
              {(["parcial", "total"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setNovoLancTipo(t)}
                  style={{
                    fontSize: 10.5,
                    fontWeight: 600,
                    padding: "6px 9px",
                    borderRadius: 7,
                    border: "none",
                    color: novoLancTipo === t ? cor.destaque : cor.textoTerciario,
                    background: novoLancTipo === t ? cor.destaqueFundo : "rgba(96,93,93,.10)",
                  }}
                >
                  {t === "total" ? "Total" : "Parcial"}
                </button>
              ))}
            </div>
            <input type="date" value={novoLancData} onChange={(e) => setNovoLancData(e.target.value)} style={{ padding: 6 }} />
            <input
              type="number"
              step="0.001"
              placeholder="Normal"
              value={novoLancNormal}
              onChange={(e) => setNovoLancNormal(e.target.value)}
              style={{ padding: 6, width: 90 }}
            />
            <input
              type="number"
              step="0.001"
              placeholder="Avaria"
              value={novoLancAvaria}
              onChange={(e) => setNovoLancAvaria(e.target.value)}
              style={{ padding: 6, width: 90 }}
            />
            <input
              type="number"
              step="0.001"
              placeholder="Desvio"
              value={novoLancDesvio}
              onChange={(e) => setNovoLancDesvio(e.target.value)}
              style={{ padding: 6, width: 90 }}
            />
            <button
              onClick={criarLancamento}
              disabled={
                salvandoLancamento ||
                !execucaoEscolhida ||
                !novoLancData ||
                Number(novoLancNormal || 0) + Number(novoLancAvaria || 0) + Number(novoLancDesvio || 0) <= 0
              }
              style={{ fontSize: 11 }}
            >
              {salvandoLancamento ? "..." : "Salvar"}
            </button>
            <button onClick={() => setCriandoLancamento(false)} disabled={salvandoLancamento} style={{ fontSize: 11 }}>
              Cancelar
            </button>
          </div>
        ) : (
          <button
            onClick={abrirNovoLancamento}
            disabled={execucoesOrdenadas.length === 0}
            style={{ fontSize: 11.5 }}
            title={execucoesOrdenadas.length === 0 ? "Cadastre uma parcela no Cronograma primeiro" : undefined}
          >
            + Criar NUP de entrega / pagamento
          </button>
        )}
      </div>
    </div>
  );
}
