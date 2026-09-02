"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cor } from "@/lib/theme";

type Execucao = {
  id: string;
  numero: number;
  quantidade: number;
  data_prevista: string | null;
  data_entrega: string | null;
  situacao: string;
};

type Tag = { id: string; valor: string };

const SITUACOES = ["pendente", "em_transito", "entregue", "atrasada"];

// Máscara de milhar em tempo real (padrão brasileiro: ponto pra milhar,
// vírgula pra decimal) — campo type=number não aceita ponto como separador
// de milhar, então números grandes digitados direto (ex.: "1.300.000")
// ficavam truncados/rejeitados. Aqui é um campo de texto comum que
// reformata a cada tecla digitada.
function formatarNumeroBR(valorDigitado: string): string {
  const limpo = valorDigitado.replace(/[^\d,]/g, "");
  const [inteiroBruto, ...resto] = limpo.split(",");
  const inteiro = inteiroBruto.replace(/^0+(?=\d)/, "");
  const inteiroFormatado = inteiro ? Number(inteiro).toLocaleString("pt-BR") : "";
  const decimal = resto.length > 0 ? "," + resto.join("").slice(0, 3) : "";
  return inteiroFormatado + decimal;
}

function paraNumero(valorFormatado: string): number {
  const normalizado = valorFormatado.replace(/\./g, "").replace(",", ".");
  return normalizado ? Number(normalizado) : 0;
}

function formatarQuantidade(n: number) {
  return n.toLocaleString("pt-BR");
}

const EVENTO_FALTA = "Falta na Entrega";
const EVENTO_DESVIO = "Desvio de qualidade";
const EVENTO_AVARIA = "Avaria na Entrega";
const EVENTO_ATRASO = "Atraso na entrega";
const PROBLEMAS_ENTREGA = [EVENTO_FALTA, EVENTO_DESVIO, EVENTO_AVARIA];
const ETAPA_CRIACAO_OFICIO = "Criação de Ofício";

const SITUACAO_COR: Record<string, { fg: string; bg: string }> = {
  pendente: { fg: "#8A6A3B", bg: "rgba(182,130,53,.09)" },
  em_transito: { fg: "#7D5411", bg: "rgba(182,130,53,.08)" },
  entregue: { fg: "#4A6B52", bg: "rgba(126,155,126,.18)" },
  atrasada: { fg: "#8C4A42", bg: "rgba(176,101,92,.16)" },
};

function calcularAtraso(dataPrevista: string | null, dataEntrega: string | null) {
  if (!dataPrevista || !dataEntrega) return null;
  const diffMs = new Date(`${dataEntrega}T00:00:00`).getTime() - new Date(`${dataPrevista}T00:00:00`).getTime();
  const diffDias = Math.round(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDias);
}

function formatarData(data: string | null) {
  return data ? new Date(`${data}T00:00:00`).toLocaleDateString("pt-BR") : "—";
}

function ordinal(n: number) {
  return `${n}ª Parcela`;
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
      <span style={{ fontSize: 9.5, fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.6, color: cor.textoTerciario }}>
        {label}
      </span>
      <div style={{ fontSize: 12.5 }}>{children}</div>
    </div>
  );
}

function CampoQuantidade({ valor, onChange }: { valor: string; onChange: (v: string) => void }) {
  return (
    <Campo label="Quantidade">
      <input
        type="text"
        inputMode="decimal"
        value={valor}
        onChange={(e) => onChange(formatarNumeroBR(e.target.value))}
        style={{ width: 90, padding: 4, textAlign: "center" }}
      />
    </Campo>
  );
}

export default function Cronograma({
  processoId,
  execucoes,
  tagsDisponiveis,
}: {
  processoId: string;
  execucoes: Execucao[];
  tagsDisponiveis: Tag[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState<string | null>(null);
  const [editando, setEditando] = useState(false);
  const [edicao, setEdicao] = useState<{
    quantidade: string;
    data_prevista: string;
    data_entrega: string;
  } | null>(null);
  const [novo, setNovo] = useState(false);
  const [novaQuantidade, setNovaQuantidade] = useState("");
  const [novaData, setNovaData] = useState("");

  const execucoesOrdenadas = [...execucoes].sort((a, b) => a.numero - b.numero);
  const [parcelaSelecionadaId, setParcelaSelecionadaId] = useState<string | null>(
    execucoesOrdenadas[0]?.id ?? null,
  );
  const selecionada = execucoesOrdenadas.find((e) => e.id === parcelaSelecionadaId) ?? null;

  const [confirmandoId, setConfirmandoId] = useState<string | null>(null);
  const [etapaConfirmacao, setEtapaConfirmacao] = useState<"pergunta" | "problemas" | null>(null);
  const [problemasMarcados, setProblemasMarcados] = useState<string[]>([]);
  const [processandoConfirmacao, setProcessandoConfirmacao] = useState(false);

  function fecharConfirmacao() {
    setConfirmandoId(null);
    setEtapaConfirmacao(null);
    setProblemasMarcados([]);
  }

  function alternarProblema(valor: string) {
    setProblemasMarcados((atual) => (atual.includes(valor) ? atual.filter((v) => v !== valor) : [...atual, valor]));
  }

  function idDaTag(valor: string) {
    return tagsDisponiveis.find((t) => t.valor === valor)?.id ?? null;
  }

  async function adicionarEventoSeNovo(tagId: string) {
    const { data: existente } = await supabase
      .from("processo_tags")
      .select("tag_id")
      .eq("processo_id", processoId)
      .eq("tag_id", tagId)
      .maybeSingle();
    if (!existente) {
      await supabase.from("processo_tags").insert({ processo_id: processoId, tag_id: tagId });
    }
  }

  // Muda a etapa do processo pra "Criação de Ofício" e devolve o id do
  // histórico de kanban aberto (novo ou já existente, se já estava nessa
  // etapa) — é nele que a tarefa de criar ofício é pendurada, pra aparecer
  // no checklist visível da etapa atual.
  async function mudarEtapaCriacaoOficio(): Promise<string | null> {
    await supabase.from("processos").update({ etapa_atual: ETAPA_CRIACAO_OFICIO }).eq("id", processoId);
    const { data: historico } = await supabase
      .from("processo_kanban_historico")
      .select("id")
      .eq("processo_id", processoId)
      .is("saida_em", null)
      .order("entrada_em", { ascending: false })
      .limit(1)
      .maybeSingle();
    return historico?.id ?? null;
  }

  async function criarTarefaOficio(origemId: string, ordem: number, label: string) {
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    await supabase.from("processo_tarefas").insert({
      processo_id: processoId,
      origem_tipo: "kanban",
      origem_id: origemId,
      ordem,
      label,
      agendamento_data: amanha.toISOString().slice(0, 10),
      periodo: "manha",
    });
  }

  async function confirmarEntregaOcorreu(execucaoId: string) {
    setErro(null);
    setProcessandoConfirmacao(true);
    const hoje = new Date().toISOString().slice(0, 10);

    const { error } = await supabase
      .from("processo_execucoes")
      .update({ situacao: "entregue", data_entrega: hoje })
      .eq("id", execucaoId);
    if (error) {
      setProcessandoConfirmacao(false);
      setErro(error.message);
      return;
    }

    if (problemasMarcados.length > 0) {
      for (const valor of problemasMarcados) {
        const tagId = idDaTag(valor);
        if (tagId) await adicionarEventoSeNovo(tagId);
      }
      const origemId = await mudarEtapaCriacaoOficio();
      if (origemId) {
        let ordem = 1;
        for (const valor of problemasMarcados) {
          await criarTarefaOficio(origemId, ordem++, `Criar ofício de ${valor}`);
        }
      }
    }

    setProcessandoConfirmacao(false);
    fecharConfirmacao();
    router.refresh();
  }

  async function confirmarEntregaNaoOcorreu(execucaoId: string) {
    setErro(null);
    setProcessandoConfirmacao(true);

    const { error } = await supabase.from("processo_execucoes").update({ situacao: "atrasada" }).eq("id", execucaoId);
    if (error) {
      setProcessandoConfirmacao(false);
      setErro(error.message);
      return;
    }

    const idAtraso = idDaTag(EVENTO_ATRASO);
    if (idAtraso) await adicionarEventoSeNovo(idAtraso);
    const idFalta = idDaTag(EVENTO_FALTA);
    if (idFalta) await adicionarEventoSeNovo(idFalta);

    const origemId = await mudarEtapaCriacaoOficio();
    if (origemId) {
      await criarTarefaOficio(origemId, 1, "Criar ofício de notificação - atraso na entrega");
    }

    setProcessandoConfirmacao(false);
    fecharConfirmacao();
    router.refresh();
  }

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
    setEditando(true);
    setEdicao({
      quantidade: formatarQuantidade(e.quantidade),
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
        quantidade: paraNumero(edicao.quantidade),
        data_prevista: edicao.data_prevista || null,
        data_entrega: edicao.data_entrega || null,
      })
      .eq("id", execucaoId);
    setCarregando(null);
    if (error) {
      setErro(error.message);
      return;
    }
    setEditando(false);
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
    setParcelaSelecionadaId(null);
    router.refresh();
  }

  async function adicionar() {
    if (!novaQuantidade) return;
    setErro(null);
    setCarregando("novo");
    const { data: criada, error } = await supabase
      .from("processo_execucoes")
      .insert({
        processo_id: processoId,
        numero: proximoNumero,
        quantidade: paraNumero(novaQuantidade),
        data_prevista: novaData || null,
      })
      .select("id")
      .single();
    setCarregando(null);
    if (error) {
      setErro(error.message);
      return;
    }
    setNovo(false);
    setNovaQuantidade("");
    setNovaData("");
    if (criada) setParcelaSelecionadaId(criada.id);
    router.refresh();
  }

  return (
    <section>
      {erro && <p style={{ color: cor.urgente }}>{erro}</p>}

      {execucoes.length === 0 && !novo && (
        <p style={{ color: cor.textoTerciario, fontSize: 13 }}>Nenhuma entrega cadastrada.</p>
      )}

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
        {execucoesOrdenadas.map((e) => (
          <button
            key={e.id}
            onClick={() => {
              setParcelaSelecionadaId(e.id);
              setNovo(false);
              setEditando(false);
              fecharConfirmacao();
            }}
            style={{
              fontSize: 11.5,
              fontWeight: 600,
              padding: "5px 12px",
              borderRadius: 20,
              border: "none",
              color: parcelaSelecionadaId === e.id && !novo ? "#fff" : cor.textoSecundario,
              background: parcelaSelecionadaId === e.id && !novo ? cor.destaque : "rgba(96,93,93,.10)",
            }}
          >
            {ordinal(e.numero)}
          </button>
        ))}
        <button
          onClick={() => {
            setNovo(true);
            setParcelaSelecionadaId(null);
          }}
          style={{
            fontSize: 11.5,
            fontWeight: 600,
            padding: "5px 12px",
            borderRadius: 20,
            border: `1.5px dashed ${cor.borda}`,
            color: cor.textoTerciario,
            background: novo ? cor.destaqueFundo : "transparent",
          }}
        >
          + Criar
        </button>
      </div>

      {novo && (
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start", flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: cor.textoTerciario, paddingTop: 6 }}>{ordinal(proximoNumero)}</span>
          <CampoQuantidade valor={novaQuantidade} onChange={setNovaQuantidade} />
          <input type="date" value={novaData} onChange={(e) => setNovaData(e.target.value)} style={{ padding: 6 }} />
          <button onClick={adicionar} disabled={carregando === "novo" || !novaQuantidade}>
            Salvar
          </button>
          <button onClick={() => setNovo(false)} disabled={carregando === "novo"}>
            Cancelar
          </button>
        </div>
      )}

      {selecionada && !novo && (() => {
        const e = selecionada;
        const atraso = calcularAtraso(e.data_prevista, e.data_entrega);
        return (
          <div style={{ border: `1px solid ${cor.borda}`, borderRadius: 12, padding: 10 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))", gap: 10 }}>
              {editando && edicao ? (
                <>
                  <CampoQuantidade
                    valor={edicao.quantidade}
                    onChange={(v) => setEdicao({ ...edicao, quantidade: v })}
                  />
                  <Campo label="Data prevista">
                    <input
                      type="date"
                      value={edicao.data_prevista}
                      onChange={(ev) => setEdicao({ ...edicao, data_prevista: ev.target.value })}
                      style={{ padding: 4 }}
                    />
                  </Campo>
                  <Campo label="Data entregue">
                    <input
                      type="date"
                      value={edicao.data_entrega}
                      onChange={(ev) => setEdicao({ ...edicao, data_entrega: ev.target.value })}
                      style={{ padding: 4 }}
                    />
                  </Campo>
                </>
              ) : (
                <>
                  <Campo label="Quantidade">{formatarQuantidade(e.quantidade)}</Campo>
                  <Campo label="Data prevista">{formatarData(e.data_prevista)}</Campo>
                  <Campo label="Data entregue">{formatarData(e.data_entrega)}</Campo>
                </>
              )}
              <Campo label="Atraso (dias)">{atraso ?? "—"}</Campo>
              <Campo label="Situação">
                <select
                  value={e.situacao}
                  onChange={(ev) => atualizarSituacao(e.id, ev.target.value)}
                  disabled={carregando === e.id}
                  style={{
                    padding: "3px 7px",
                    borderRadius: 20,
                    border: "none",
                    fontWeight: 600,
                    fontSize: 10.5,
                    color: SITUACAO_COR[e.situacao]?.fg,
                    background: SITUACAO_COR[e.situacao]?.bg,
                  }}
                >
                  {SITUACOES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Campo>
            </div>

            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 10 }}>
              {editando ? (
                <>
                  <button onClick={() => salvarEdicao(e.id)} disabled={carregando === e.id} style={{ fontSize: 11 }}>
                    Salvar
                  </button>
                  <button
                    onClick={() => {
                      setEditando(false);
                      setEdicao(null);
                    }}
                    disabled={carregando === e.id}
                    style={{ fontSize: 11 }}
                  >
                    Cancelar
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => abrirEdicao(e)} disabled={carregando === e.id} style={{ fontSize: 11 }}>
                    editar
                  </button>
                  <button onClick={() => remover(e.id)} disabled={carregando === e.id} style={{ fontSize: 11 }}>
                    remover
                  </button>
                  {confirmandoId !== e.id && (
                    <button
                      onClick={() => { setConfirmandoId(e.id); setEtapaConfirmacao("pergunta"); setProblemasMarcados([]); }}
                      style={{ fontSize: 11 }}
                    >
                      confirmar entrega
                    </button>
                  )}
                </>
              )}
            </div>

            {confirmandoId === e.id && (
              <div
                style={{
                  marginTop: 10,
                  padding: 10,
                  borderRadius: 10,
                  background: cor.fundo,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  alignItems: "center",
                }}
              >
                {etapaConfirmacao === "pergunta" && (
                  <>
                    <span style={{ fontSize: 12.5, fontWeight: 600 }}>A entrega ocorreu?</span>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => setEtapaConfirmacao("problemas")}
                        disabled={processandoConfirmacao}
                        style={{ fontSize: 11.5 }}
                      >
                        Sim
                      </button>
                      <button
                        onClick={() => confirmarEntregaNaoOcorreu(e.id)}
                        disabled={processandoConfirmacao}
                        style={{ fontSize: 11.5 }}
                      >
                        {processandoConfirmacao ? "..." : "Não"}
                      </button>
                      <button onClick={fecharConfirmacao} disabled={processandoConfirmacao} style={{ fontSize: 11.5 }}>
                        Cancelar
                      </button>
                    </div>
                  </>
                )}
                {etapaConfirmacao === "problemas" && (
                  <>
                    <span style={{ fontSize: 12.5, fontWeight: 600 }}>
                      Ocorreu algum desses problemas na entrega?
                    </span>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
                      {PROBLEMAS_ENTREGA.map((valor) => (
                        <label key={valor} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
                          <input
                            type="checkbox"
                            checked={problemasMarcados.includes(valor)}
                            onChange={() => alternarProblema(valor)}
                          />
                          {valor}
                        </label>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => confirmarEntregaOcorreu(e.id)}
                        disabled={processandoConfirmacao}
                        style={{ fontSize: 11.5 }}
                      >
                        {processandoConfirmacao ? "..." : "Confirmar"}
                      </button>
                      <button onClick={fecharConfirmacao} disabled={processandoConfirmacao} style={{ fontSize: 11.5 }}>
                        Cancelar
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        );
      })()}
    </section>
  );
}
