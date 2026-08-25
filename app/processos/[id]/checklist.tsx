"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { botaoPrimario, cor } from "@/lib/theme";

type Tarefa = {
  id: string;
  label: string;
  concluida: boolean;
  agendamentoData: string | null;
  agendamentoHorario: string | null;
};
type Grupo = { origemId: string; origemTipo: string; nome: string; tarefas: Tarefa[] };

function formatarAgendamento(data: string | null, horario: string | null) {
  if (!data) return null;
  const dataFmt = new Date(`${data}T00:00:00`).toLocaleDateString("pt-BR");
  return horario ? `${dataFmt} ${horario.slice(0, 5)}` : dataFmt;
}

function ListaTarefas({
  tarefas,
  carregando,
  onAlternar,
  onAgendar,
  onReordenar,
}: {
  tarefas: Tarefa[];
  carregando: string | null;
  onAlternar: (t: Tarefa) => void;
  onAgendar: (id: string, data: string, horario: string) => void;
  onReordenar: (tarefas: Tarefa[]) => void;
}) {
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [data, setData] = useState("");
  const [horario, setHorario] = useState("");
  const [arrastandoId, setArrastandoId] = useState<string | null>(null);

  function abrirEdicao(t: Tarefa) {
    setEditandoId(t.id);
    setData(t.agendamentoData ?? "");
    setHorario(t.agendamentoHorario?.slice(0, 5) ?? "");
  }

  function salvarAgendamento(id: string) {
    onAgendar(id, data, horario);
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
                  color: formatarAgendamento(t.agendamentoData, t.agendamentoHorario) ? cor.destaque : cor.textoTerciario,
                  background: formatarAgendamento(t.agendamentoData, t.agendamentoHorario) ? cor.destaqueFundo : "rgba(96,93,93,.10)",
                }}
              >
                {formatarAgendamento(t.agendamentoData, t.agendamentoHorario) ?? "+ agendar"}
              </button>
            )}
          </div>
          {editandoId === t.id && (
            <div style={{ display: "flex", gap: 6, alignItems: "center", padding: "0 8px 8px 34px", flexWrap: "wrap" }}>
              <input type="date" value={data} onChange={(e) => setData(e.target.value)} style={{ padding: 5, fontSize: 12 }} />
              <input type="time" value={horario} onChange={(e) => setHorario(e.target.value)} style={{ padding: 5, fontSize: 12 }} />
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

export default function Checklist({ processoId, grupos }: { processoId: string; grupos: Grupo[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState<string | null>(null);
  const [abaAtiva, setAbaAtiva] = useState<string | null>(null);
  const [novaTarefa, setNovaTarefa] = useState(false);
  const [tarefaLabel, setTarefaLabel] = useState("");
  const [tarefaData, setTarefaData] = useState("");
  const [tarefaHorario, setTarefaHorario] = useState("");

  const grupoKanban = grupos.find((g) => g.origemTipo === "kanban");
  const gruposEvento = grupos.filter((g) => g.origemTipo === "evento");
  const grupoAtivo = gruposEvento.find((g) => g.origemId === abaAtiva) ?? gruposEvento[0] ?? null;

  async function alternar(tarefa: Tarefa) {
    setErro(null);
    setCarregando(tarefa.id);
    const { error } = await supabase
      .from("processo_tarefas")
      .update({ concluida: !tarefa.concluida })
      .eq("id", tarefa.id);
    setCarregando(null);
    if (error) {
      setErro(error.message);
      return;
    }
    router.refresh();
  }

  async function agendar(tarefaId: string, data: string, horario: string) {
    setErro(null);
    const { error } = await supabase
      .from("processo_tarefas")
      .update({ agendamento_data: data || null, agendamento_horario: horario || null })
      .eq("id", tarefaId);
    if (error) {
      setErro(error.message);
      return;
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

  async function adicionarTarefa() {
    if (!tarefaLabel.trim() || !grupoAtivo) return;
    setErro(null);
    setCarregando("nova-tarefa");
    const { error } = await supabase.from("processo_tarefas").insert({
      processo_id: processoId,
      origem_tipo: "evento",
      origem_id: grupoAtivo.origemId,
      ordem: grupoAtivo.tarefas.length + 1,
      label: tarefaLabel.trim(),
      agendamento_data: tarefaData || null,
      agendamento_horario: tarefaHorario || null,
    });
    setCarregando(null);
    if (error) {
      setErro(error.message);
      return;
    }
    setNovaTarefa(false);
    setTarefaLabel("");
    setTarefaData("");
    setTarefaHorario("");
    router.refresh();
  }

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {grupoKanban && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12.5, fontWeight: 600 }}>Etapa: {grupoKanban.nome}</span>
            <div style={{ flex: 1 }}>
              <Progresso
                concluidas={grupoKanban.tarefas.filter((t) => t.concluida).length}
                total={grupoKanban.tarefas.length}
              />
            </div>
          </div>
          <ListaTarefas
            tarefas={grupoKanban.tarefas}
            carregando={carregando}
            onAlternar={alternar}
            onAgendar={agendar}
            onReordenar={reordenar}
          />
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span style={{ fontSize: 10.5, fontWeight: 500, textTransform: "uppercase", letterSpacing: 1, color: cor.textoTerciario }}>
          Eventos
        </span>

        {gruposEvento.length > 0 ? (
          <>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {gruposEvento.map((g) => {
                const ativo = grupoAtivo?.origemId === g.origemId;
                return (
                  <button
                    key={g.origemId}
                    type="button"
                    onClick={() => setAbaAtiva(g.origemId)}
                    style={{
                      fontSize: 11.5,
                      padding: "6px 12px",
                      borderRadius: 9,
                      border: "none",
                      background: ativo ? cor.destaque : "rgba(96,93,93,.10)",
                      color: ativo ? "#fff" : cor.textoSecundario,
                    }}
                  >
                    {g.nome} ({g.tarefas.filter((t) => t.concluida).length}/{g.tarefas.length})
                  </button>
                );
              })}
            </div>

            {grupoAtivo && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <Progresso
                  concluidas={grupoAtivo.tarefas.filter((t) => t.concluida).length}
                  total={grupoAtivo.tarefas.length}
                />
                <ListaTarefas
                  tarefas={grupoAtivo.tarefas}
                  carregando={carregando}
                  onAlternar={alternar}
                  onAgendar={agendar}
                  onReordenar={reordenar}
                />

                {novaTarefa ? (
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
                    <input type="time" value={tarefaHorario} onChange={(e) => setTarefaHorario(e.target.value)} style={{ padding: 6 }} />
                    <button
                      onClick={adicionarTarefa}
                      disabled={carregando === "nova-tarefa" || !tarefaLabel.trim()}
                      style={{ ...botaoPrimario, fontSize: 11, padding: "6px 12px" }}
                    >
                      Salvar
                    </button>
                    <button onClick={() => setNovaTarefa(false)} disabled={carregando === "nova-tarefa"} style={{ fontSize: 11 }}>
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setNovaTarefa(true)}
                    style={{ alignSelf: "flex-start", fontSize: 12, color: cor.textoTerciario, borderStyle: "dashed" }}
                  >
                    + Adicionar tarefa
                  </button>
                )}
              </div>
            )}
          </>
        ) : (
          <p style={{ color: cor.textoTerciario, fontSize: 13, margin: 0 }}>Nenhum evento ativo.</p>
        )}
      </div>

      {erro && <p style={{ color: cor.urgente, margin: 0 }}>{erro}</p>}
    </section>
  );
}
