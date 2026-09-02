"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { botaoPrimario, cor } from "@/lib/theme";
import { sincronizarGoogle } from "@/lib/google-sync-cliente";

type Periodo = "manha" | "tarde";
type Tarefa = {
  id: string;
  label: string;
  concluida: boolean;
  agendamentoData: string | null;
  periodo: Periodo | null;
  googleEventId: string | null;
};
type Grupo = { origemId: string; origemTipo: string; nome: string; tarefas: Tarefa[] };
type Observacao = { id: string; texto: string; autor: string | null; criadoEm: string };

function formatarAgendamento(data: string | null, periodo: Periodo | null) {
  if (!data) return null;
  const dataFmt = new Date(`${data}T00:00:00`).toLocaleDateString("pt-BR");
  const periodoFmt = periodo === "manha" ? "Manhã" : periodo === "tarde" ? "Tarde" : null;
  return periodoFmt ? `${dataFmt} · ${periodoFmt}` : dataFmt;
}

function SeletorPeriodo({ valor, onChange }: { valor: Periodo | ""; onChange: (p: Periodo) => void }) {
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {(["manha", "tarde"] as Periodo[]).map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onChange(p)}
          style={{
            fontSize: 10.5,
            fontWeight: 600,
            padding: "4px 9px",
            borderRadius: 7,
            border: "none",
            color: valor === p ? cor.destaque : cor.textoTerciario,
            background: valor === p ? cor.destaqueFundo : "rgba(96,93,93,.10)",
          }}
        >
          {p === "manha" ? "Manhã" : "Tarde"}
        </button>
      ))}
    </div>
  );
}

function ListaTarefas({
  tarefas,
  carregando,
  onAlternar,
  onAgendar,
  onReordenar,
  onObservar,
}: {
  tarefas: Tarefa[];
  carregando: string | null;
  onAlternar: (t: Tarefa) => void;
  onAgendar: (id: string, data: string, periodo: Periodo | "") => void;
  onReordenar: (tarefas: Tarefa[]) => void;
  onObservar: (id: string) => void;
}) {
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [data, setData] = useState("");
  const [periodo, setPeriodo] = useState<Periodo | "">("");
  const [arrastandoId, setArrastandoId] = useState<string | null>(null);

  function abrirEdicao(t: Tarefa) {
    setEditandoId(t.id);
    setData(t.agendamentoData ?? "");
    setPeriodo(t.periodo ?? "");
  }

  function salvarAgendamento(id: string) {
    onAgendar(id, data, periodo);
    setEditandoId(null);
  }

  function soltar(alvoId: string) {
    if (!arrastandoId || arrastandoId === alvoId) return;
    const lista = [...tarefas];
    const origemIdx = lista.findIndex((t) => t.id === arrastandoId);
    const destinoIdx = lista.findIndex((t) => t.id === alvoId);
    if (origemIdx === -1 || destinoIdx === -1) return;
    const [movida] = lista.splice(origemIdx, 1);
    lista.splice(destinoIdx, 0, movida);
    setArrastandoId(null);
    onReordenar(lista);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {tarefas.map((t) => (
        <div key={t.id}>
          <div
            draggable
            onDragStart={() => setArrastandoId(t.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => soltar(t.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              borderRadius: 10,
              padding: "7px 8px",
              opacity: arrastandoId === t.id ? 0.4 : carregando === t.id ? 0.6 : 1,
              background: t.concluida ? "rgba(126,155,126,.08)" : "transparent",
            }}
          >
            <span style={{ flex: "none", cursor: "grab", color: cor.textoTerciario, fontSize: 12 }}>⠿</span>
            <span
              onClick={() => (carregando ? null : onAlternar(t))}
              style={{
                flex: "none",
                width: 18,
                height: 18,
                borderRadius: 6,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 600,
                color: "#fff",
                cursor: carregando ? "default" : "pointer",
                background: t.concluida ? cor.positivo : "rgba(32,31,29,.18)",
              }}
            >
              {t.concluida ? "✓" : ""}
            </span>
            <span
              onClick={() => (carregando ? null : onAlternar(t))}
              style={{
                flex: 1,
                fontSize: 12.5,
                cursor: carregando ? "default" : "pointer",
                textDecoration: t.concluida ? "line-through" : "none",
                color: t.concluida ? cor.textoTerciario : cor.texto,
              }}
            >
              {t.label}
            </span>
            <button
              type="button"
              onClick={() => onObservar(t.id)}
              title="Observações"
              aria-label="Observações"
              style={{
                flex: "none",
                width: 20,
                height: 20,
                padding: 0,
                fontSize: 12,
                fontWeight: 700,
                borderRadius: 6,
                border: "none",
                color: cor.textoTerciario,
                background: "rgba(96,93,93,.10)",
              }}
            >
              +
            </button>
            {!t.concluida && (
              <button
                type="button"
                onClick={() => (editandoId === t.id ? setEditandoId(null) : abrirEdicao(t))}
                style={{
                  flex: "none",
                  fontSize: 10,
                  fontWeight: 600,
                  padding: "2px 7px",
                  border: "none",
                  borderRadius: 7,
                  color: formatarAgendamento(t.agendamentoData, t.periodo) ? cor.destaque : cor.textoTerciario,
                  background: formatarAgendamento(t.agendamentoData, t.periodo) ? cor.destaqueFundo : "rgba(96,93,93,.10)",
                }}
              >
                {formatarAgendamento(t.agendamentoData, t.periodo) ?? "+ agendar"}
              </button>
            )}
          </div>
          {editandoId === t.id && (
            <div style={{ display: "flex", gap: 6, alignItems: "center", padding: "0 8px 8px 34px", flexWrap: "wrap" }}>
              <input type="date" value={data} onChange={(e) => setData(e.target.value)} style={{ padding: 5, fontSize: 12 }} />
              <SeletorPeriodo valor={periodo} onChange={setPeriodo} />
              <button onClick={() => salvarAgendamento(t.id)} style={{ fontSize: 10.5, padding: "4px 10px" }}>
                Salvar
              </button>
              {t.agendamentoData && (
                <button onClick={() => { onAgendar(t.id, "", ""); setEditandoId(null); }} style={{ fontSize: 10.5, padding: "4px 10px" }}>
                  Remover
                </button>
              )}
              <button onClick={() => setEditandoId(null)} style={{ fontSize: 10.5, padding: "4px 10px" }}>
                Cancelar
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function Progresso({ concluidas, total }: { concluidas: number; total: number }) {
  const percentual = total ? Math.round((concluidas / total) * 100) : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 4, borderRadius: 2, background: "rgba(32,31,29,.10)" }}>
        <div style={{ height: "100%", borderRadius: 2, background: cor.positivo, width: `${percentual}%` }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color: cor.textoTerciario, whiteSpace: "nowrap" }}>
        {concluidas}/{total}
      </span>
    </div>
  );
}

function CabecalhoRecolhivel({ titulo, aberto, onToggle }: { titulo: string; aberto: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        border: "none",
        background: "transparent",
        padding: 0,
        fontSize: 10.5,
        fontWeight: 500,
        textTransform: "uppercase",
        letterSpacing: 1,
        color: cor.textoTerciario,
      }}
    >
      <span style={{ fontSize: 9 }}>{aberto ? "▾" : "▸"}</span>
      {titulo}
    </button>
  );
}

export default function Checklist({
  processoId,
  autorId,
  numeroContrato,
  grupos,
}: {
  processoId: string;
  autorId: string | null;
  numeroContrato: string;
  grupos: Grupo[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState<string | null>(null);
  const [abertoTarefas, setAbertoTarefas] = useState(true);
  const [novaTarefaEm, setNovaTarefaEm] = useState<string | null>(null);
  const [tarefaLabel, setTarefaLabel] = useState("");
  const [tarefaData, setTarefaData] = useState("");
  const [tarefaPeriodo, setTarefaPeriodo] = useState<Periodo | "">("");
  const [modalTarefaId, setModalTarefaId] = useState<string | null>(null);
  const [modalObservacoes, setModalObservacoes] = useState<Observacao[] | null>(null);
  const [novaObs, setNovaObs] = useState("");
  const [salvandoObs, setSalvandoObs] = useState(false);

  const grupoKanban = grupos.find((g) => g.origemTipo === "kanban");

  async function alternar(tarefa: Tarefa) {
    setErro(null);
    setCarregando(tarefa.id);
    const novaConcluida = !tarefa.concluida;
    const { error } = await supabase
      .from("processo_tarefas")
      .update({ concluida: novaConcluida })
      .eq("id", tarefa.id);
    setCarregando(null);
    if (error) {
      setErro(error.message);
      return;
    }
    if (tarefa.agendamentoData && tarefa.googleEventId) {
      sincronizarGoogle({
        tipo: "tarefa",
        acao: "concluir",
        id: tarefa.id,
        googleEventId: tarefa.googleEventId,
        numeroContrato,
        descricao: tarefa.label,
        concluida: novaConcluida,
        processoId,
      });
    }
    router.refresh();
  }

  async function agendar(tarefaId: string, data: string, periodo: Periodo | "") {
    setErro(null);
    // lembrete_enviado volta pra false sempre que a data/período é definido
    // (inclusive reagendando um já avisado) — é o jeito de "reenviar" o
    // lembrete manualmente, já que não há reenvio automático.
    const { error } = await supabase
      .from("processo_tarefas")
      .update({
        agendamento_data: data || null,
        periodo: periodo || null,
        lembrete_enviado: data && periodo ? false : undefined,
      })
      .eq("id", tarefaId);
    if (error) {
      setErro(error.message);
      return;
    }
    const tarefa = grupos.flatMap((g) => g.tarefas).find((t) => t.id === tarefaId);
    if (tarefa) {
      sincronizarGoogle({
        tipo: "tarefa",
        acao: data && periodo ? "salvar" : "remover",
        id: tarefaId,
        googleEventId: tarefa.googleEventId,
        numeroContrato,
        descricao: tarefa.label,
        data: data || undefined,
        processoId,
      });
    }
    router.refresh();
  }

  async function reordenar(tarefas: Tarefa[]) {
    setErro(null);
    const resultados = await Promise.all(
      tarefas.map((t, i) => supabase.from("processo_tarefas").update({ ordem: i + 1 }).eq("id", t.id)),
    );
    const falhou = resultados.find((r) => r.error);
    if (falhou?.error) {
      setErro(falhou.error.message);
      return;
    }
    router.refresh();
  }

  async function adicionarTarefa(grupo: Grupo) {
    if (!tarefaLabel.trim()) return;
    setErro(null);
    setCarregando("nova-tarefa");
    const { data: criada, error } = await supabase
      .from("processo_tarefas")
      .insert({
        processo_id: processoId,
        origem_tipo: grupo.origemTipo,
        origem_id: grupo.origemId,
        ordem: grupo.tarefas.length + 1,
        label: tarefaLabel.trim(),
        agendamento_data: tarefaData || null,
        periodo: tarefaPeriodo || null,
      })
      .select("id")
      .single();
    setCarregando(null);
    if (error) {
      setErro(error.message);
      return;
    }
    if (criada && tarefaData && tarefaPeriodo) {
      sincronizarGoogle({
        tipo: "tarefa",
        acao: "salvar",
        id: criada.id,
        googleEventId: null,
        numeroContrato,
        descricao: tarefaLabel.trim(),
        data: tarefaData,
        processoId,
      });
    }
    setNovaTarefaEm(null);
    setTarefaLabel("");
    setTarefaData("");
    setTarefaPeriodo("");
    router.refresh();
  }

  async function abrirObservacoes(tarefaId: string) {
    setModalTarefaId(tarefaId);
    setModalObservacoes(null);
    const { data } = await supabase
      .from("processo_tarefa_observacoes")
      .select("id, texto, created_at, autor:pessoas(nome)")
      .eq("tarefa_id", tarefaId)
      .order("created_at");
    setModalObservacoes(
      (data ?? []).map((o: any) => ({ id: o.id, texto: o.texto, autor: o.autor?.nome ?? null, criadoEm: o.created_at })),
    );
  }

  async function adicionarObservacao() {
    if (!novaObs.trim() || !modalTarefaId) return;
    setSalvandoObs(true);
    const { error } = await supabase.from("processo_tarefa_observacoes").insert({
      tarefa_id: modalTarefaId,
      texto: novaObs.trim(),
      autor_id: autorId,
    });
    setSalvandoObs(false);
    if (error) {
      setErro(error.message);
      return;
    }
    setNovaObs("");
    abrirObservacoes(modalTarefaId);
  }

  function formularioNovaTarefa(grupo: Grupo) {
    return novaTarefaEm === grupo.origemId ? (
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          padding: 10,
          background: cor.fundo,
          borderRadius: 10,
          alignItems: "center",
        }}
      >
        <input
          placeholder="O que precisa ser feito?"
          value={tarefaLabel}
          onChange={(e) => setTarefaLabel(e.target.value)}
          style={{ padding: 6, flex: 1, minWidth: 160 }}
        />
        <input type="date" value={tarefaData} onChange={(e) => setTarefaData(e.target.value)} style={{ padding: 6 }} />
        <SeletorPeriodo valor={tarefaPeriodo} onChange={setTarefaPeriodo} />
        <button
          onClick={() => adicionarTarefa(grupo)}
          disabled={carregando === "nova-tarefa" || !tarefaLabel.trim()}
          style={{ ...botaoPrimario, fontSize: 11, padding: "6px 12px" }}
        >
          Salvar
        </button>
        <button onClick={() => setNovaTarefaEm(null)} disabled={carregando === "nova-tarefa"} style={{ fontSize: 11 }}>
          Cancelar
        </button>
      </div>
    ) : (
      <button
        type="button"
        onClick={() => setNovaTarefaEm(grupo.origemId)}
        style={{ alignSelf: "flex-start", fontSize: 12, color: cor.textoTerciario, borderStyle: "dashed" }}
      >
        + Adicionar tarefa
      </button>
    );
  }

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {grupoKanban && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <CabecalhoRecolhivel titulo="Tarefas" aberto={abertoTarefas} onToggle={() => setAbertoTarefas((a) => !a)} />
            <div style={{ flex: 1 }}>
              <Progresso
                concluidas={grupoKanban.tarefas.filter((t) => t.concluida).length}
                total={grupoKanban.tarefas.length}
              />
            </div>
          </div>
          {abertoTarefas && (
            <>
              <ListaTarefas
                tarefas={grupoKanban.tarefas}
                carregando={carregando}
                onAlternar={alternar}
                onAgendar={agendar}
                onReordenar={reordenar}
                onObservar={abrirObservacoes}
              />
              {formularioNovaTarefa(grupoKanban)}
            </>
          )}
        </div>
      )}

      {erro && <p style={{ color: cor.urgente, margin: 0 }}>{erro}</p>}

      {modalTarefaId && (
        <div
          onClick={() => setModalTarefaId(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 60,
            background: "rgba(32,31,29,.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: 18,
              width: "100%",
              maxWidth: 420,
              maxHeight: "80vh",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <strong style={{ fontSize: 13 }}>Observações</strong>
              <button
                type="button"
                onClick={() => setModalTarefaId(null)}
                aria-label="Fechar"
                style={{ width: 26, height: 26, borderRadius: "50%", border: "none", background: "rgba(32,31,29,.08)" }}
              >
                ×
              </button>
            </div>

            <div style={{ overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
              {modalObservacoes === null && <p style={{ fontSize: 12.5, color: cor.textoTerciario }}>Carregando…</p>}
              {modalObservacoes?.length === 0 && (
                <p style={{ fontSize: 12.5, color: cor.textoTerciario }}>Nenhuma observação ainda.</p>
              )}
              {modalObservacoes?.map((o) => (
                <div key={o.id} style={{ borderBottom: `1px solid ${cor.borda}`, paddingBottom: 8 }}>
                  <p style={{ margin: 0, fontSize: 12.5 }}>{o.texto}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 10.5, color: cor.textoTerciario }}>
                    {o.autor ? `${o.autor} · ` : ""}
                    {new Date(o.criadoEm).toLocaleString("pt-BR")}
                  </p>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 6 }}>
              <input
                placeholder="Nova observação..."
                value={novaObs}
                onChange={(e) => setNovaObs(e.target.value)}
                style={{ flex: 1, padding: 7 }}
              />
              <button
                onClick={adicionarObservacao}
                disabled={salvandoObs || !novaObs.trim()}
                style={{ ...botaoPrimario, fontSize: 11, padding: "6px 12px" }}
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
