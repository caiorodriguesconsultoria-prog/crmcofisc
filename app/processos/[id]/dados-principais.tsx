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
  entrega: { id: string; valor: string } | null;
  pagamento: { id: string; valor: string } | null;
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

export default function DadosPrincipais({
  processoId,
  nupPrincipal,
  nupRelatorio,
  paresNup,
  execucoesSemPar,
  fornecedorNome,
  cnpj,
  objeto,
  unidadeMedida,
}: {
  processoId: string;
  nupPrincipal: string;
  nupRelatorio: Nup | null;
  paresNup: ParNup[];
  execucoesSemPar: ExecucaoOpcao[];
  fornecedorNome: string;
  cnpj: string;
  objeto: string;
  unidadeMedida: string | null;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [editando, setEditando] = useState<"relatorio" | "unidade" | null>(null);
  const [valor, setValor] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  // Edição de um NUP de parcela (entrega ou pagamento) — identificado pelo
  // id da linha em processo_nups, que já existe desde a criação do par.
  const [editandoNupId, setEditandoNupId] = useState<string | null>(null);
  const [valorNup, setValorNup] = useState("");
  const [salvandoNup, setSalvandoNup] = useState(false);

  const [criandoPar, setCriandoPar] = useState(false);
  const [execucaoEscolhida, setExecucaoEscolhida] = useState("");
  const [salvandoPar, setSalvandoPar] = useState(false);

  function abrirEdicao(tipo: "relatorio", atual: Nup | null) {
    setEditando(tipo);
    setValor(atual?.valor ?? "");
    setErro(null);
  }

  async function salvar(tipo: "relatorio", atual: Nup | null) {
    setErro(null);
    setSalvando(true);
    const { error } = atual
      ? await supabase.from("processo_nups").update({ nup: valor.trim() }).eq("id", atual.id)
      : await supabase
          .from("processo_nups")
          .insert({ processo_id: processoId, tipo, nup: valor.trim() });
    setSalvando(false);
    if (error) {
      setErro(error.message);
      return;
    }
    setEditando(null);
    router.refresh();
  }

  function abrirEdicaoUnidade() {
    setEditando("unidade");
    setValor(unidadeMedida ?? "");
    setErro(null);
  }

  async function salvarUnidade() {
    setErro(null);
    setSalvando(true);
    const { error } = await supabase
      .from("processos")
      .update({ unidade_medida: valor.trim() || null })
      .eq("id", processoId);
    setSalvando(false);
    if (error) {
      setErro(error.message);
      return;
    }
    setEditando(null);
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
    const { error } = await supabase.from("processo_nups").insert([
      { processo_id: processoId, tipo: "entrega", execucao_id: execucaoEscolhida },
      { processo_id: processoId, tipo: "pagamento", execucao_id: execucaoEscolhida },
    ]);
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

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
        <Coluna label="NUP Principal" valor={nupPrincipal} />
        {editando === "relatorio" ? (
          <div style={{ display: "flex", gap: 6 }}>
            <input value={valor} onChange={(e) => setValor(e.target.value)} style={{ flex: 1, padding: 6 }} />
            <button onClick={() => salvar("relatorio", nupRelatorio)} disabled={salvando || !valor.trim()} style={{ fontSize: 11 }}>
              Salvar
            </button>
            <button onClick={() => setEditando(null)} disabled={salvando} style={{ fontSize: 11 }}>
              X
            </button>
          </div>
        ) : (
          <Coluna
            label="NUP Relatório"
            valor={nupRelatorio?.valor ?? "não informado"}
            acao={
              <button onClick={() => abrirEdicao("relatorio", nupRelatorio)} style={{ fontSize: 10, padding: "2px 6px" }}>
                editar
              </button>
            }
          />
        )}
      </div>

      {erro && <p style={{ color: cor.urgente, margin: 0, fontSize: 12 }}>{erro}</p>}

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
        {editando === "unidade" ? (
          <div style={{ display: "flex", gap: 6 }}>
            <input
              autoFocus
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="ex.: frascos, caixas"
              style={{ flex: 1, padding: 6 }}
            />
            <button onClick={salvarUnidade} disabled={salvando} style={{ fontSize: 11 }}>
              Salvar
            </button>
            <button onClick={() => setEditando(null)} disabled={salvando} style={{ fontSize: 11 }}>
              X
            </button>
          </div>
        ) : (
          <Coluna
            label="Unidade de medida"
            valor={unidadeMedida ?? "não informado"}
            acao={
              <button onClick={abrirEdicaoUnidade} style={{ fontSize: 10, padding: "2px 6px" }}>
                editar
              </button>
            }
          />
        )}
      </div>

      {/* NUPs de entrega/pagamento por parcela — ligados ao cronograma */}
      {paresNup.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 4, borderTop: `1px solid ${cor.borda}` }}>
          {paresNup.map((par) => (
            <div key={par.execucaoId} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {(["entrega", "pagamento"] as const).map((tipo) => {
                const linha = par[tipo];
                const rotulo = `NUP ${tipo === "entrega" ? "Entrega" : "Pagamento"} - ${par.numero}ª Parcela`;
                if (!linha) return <div key={tipo} />;
                return editandoNupId === linha.id ? (
                  <div key={tipo} style={{ display: "flex", gap: 6 }}>
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
                    key={tipo}
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
          ))}
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
            title={execucoesSemPar.length === 0 ? "Todas as parcelas já têm NUP" : undefined}
          >
            + Criar NUP
          </button>
        )}
      </div>
    </div>
  );
}
