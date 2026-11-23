"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { botaoPrimario, cor } from "@/lib/theme";
import { sincronizarGoogle } from "@/lib/google-sync-cliente";
import { corEvento } from "@/lib/cores-evento";

type Tag = { id: string; valor: string; cor?: string | null };

type Tarefa = {
  id: string;
  label: string;
  concluida: boolean;
  agendamentoData: string | null;
  googleEventId: string | null;
  tags: Tag[];
};
type Grupo = { origemId: string; origemTipo: string; nome: string; tarefas: Tarefa[] };
type Observacao = { id: string; texto: string; autor: string | null; criadoEm: string };

function formatarAgendamento(data: string | null) {
  if (!data) return null;
  return new Date(`${data}T00:00:00`).toLocaleDateString("pt-BR");
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
  onAgendar: (id: string, data: string) => void;
  onReordenar: (tarefas: Tarefa[]) => void;
  onObservar: (id: string) => void;
}) {
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [data, setData] = useState("");
  const [arrastandoId, setArrastandoId] = useState<string | null>(null);

  function abrirEdicao(t: Tarefa) {
    setEditandoId(t.id);
    setData(t.agendamentoData ?? "");
  }

  function salvarAgendamento(id: string) {
    onAgendar(id, data);
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
              {t.tags.map((tag) => {
                const c = corEvento(tag.id, tag.cor);
                return (
                  <span
                    key={tag.id}
                    style={{
                      display: "inline-block",
                      fontSize: 10.5,
                      fontWeight: 600,
                      color: c.texto,
                      background: c.fundo,
                      borderRadius: 7,
                      padding: "1px 6px",
                      marginRight: 5,
                    }}
                  >
                    {tag.valor}
                  </span>
                );
              })}
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
                  color: formatarAgendamento(t.agendamentoData) ? cor.destaque : cor.textoTerciario,
                  background: formatarAgendamento(t.agendamentoData) ? cor.destaqueFundo : "rgba(96,93,93,.10)",
                }}
              >
                {formatarAgendamento(t.agendamentoData) ?? "+ agendar"}
              </button>
            )}
          </div>
          {editandoId === t.id && (
            <div style={{ display: "flex", gap: 6, alignItems: "center", padding: "0 8px 8px 34px", flexWrap: "wrap" }}>
              <input type="date" value={data} onChange={(e) => setData(e.target.value)} style={{ padding: 5, fontSize: 12 }} />
              <button onClick={() => salvarAgendamento(t.id)} style={{ fontSize: 10.5, padding: "4px 10px" }}>
                Salvar
              </button>
              {t.agendamentoData && (
                <button onClick={() => { onAgendar(t.id, ""); setEditandoId(null); }} style={{ fontSize: 10.5, padding: "4px 10px" }}>
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
  tagsDisponiveis,
}: {
  processoId: string;
  autorId: string | null;
  numeroContrato: string;
  grupos: Grupo[];
  tagsDisponiveis: Tag[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState<string | null>(null);
  // Fechado por padrão nenhum grupo — cada grupo (Kanban + um por evento
  // ativo) começa aberto; guarda só quem o Caio fechou manualmente.
  const [gruposFechados, setGruposFechados] = useState<Set<string>>(new Set());
  const [novaTarefaEm, setNovaTarefaEm] = useState<string | null>(null);
  const [tarefaLabel, setTarefaLabel] = useState("");
  const [tarefaData, setTarefaData] = useState("");
  const [tarefaTagIds, setTarefaTagIds] = useState<string[]>([]);
  // Atalho "/" na barra de texto da nova tarefa — digitar "/" (e, opcional,
  // parte do nome) abre uma lista de tags pra marcar sem precisar ir até o
  // menu suspenso. null = não está em modo de busca agora.
  const [buscaTagSlash, setBuscaTagSlash] = useState<string | null>(null);
  const tarefaInputRef = useRef<HTMLInputElement>(null);
  const [modalTarefaId, setModalTarefaId] = useState<string | null>(null);
  const [modalObservacoes, setModalObservacoes] = useState<Observacao[] | null>(null);
  const [novaObs, setNovaObs] = useState("");
  const [salvandoObs, setSalvandoObs] = useState(false);

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

  async function agendar(tarefaId: string, data: string) {
    setErro(null);
    // lembrete_enviado volta pra false sempre que a data é definida
    // (inclusive reagendando uma já avisada) — é o jeito de "reenviar" o
    // lembrete manualmente, já que não há reenvio automático.
    const { error } = await supabase
      .from("processo_tarefas")
      .update({
        agendamento_data: data || null,
        periodo: null,
        lembrete_enviado: data ? false : undefined,
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
        acao: data ? "salvar" : "remover",
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
      })
      .select("id")
      .single();
    setCarregando(null);
    if (error) {
      setErro(error.message);
      return;
    }
    if (criada && tarefaTagIds.length > 0) {
      await supabase
        .from("tarefa_tags")
        .insert(tarefaTagIds.map((tagId) => ({ tarefa_id: criada.id, tag_id: tagId })));
    }
    if (criada && tarefaData) {
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
    setTarefaTagIds([]);
    setBuscaTagSlash(null);
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

  // Digitar "/" na barra da nova tarefa entra em modo de busca de tag — o
  // texto depois da "/" (até o próximo espaço) filtra a lista. Selecionar
  // uma tira o "/termo" do texto e marca a tag, sem perder o resto do que
  // já tinha sido escrito antes da "/".
  function aoDigitarTarefaLabel(valor: string) {
    setTarefaLabel(valor);
    const m = valor.match(/\/(\S*)$/);
    setBuscaTagSlash(m ? m[1] : null);
  }

  function selecionarTagViaSlash(tagId: string) {
    setTarefaLabel((atual) => atual.replace(/\/(\S*)$/, ""));
    setTarefaTagIds((ids) => (ids.includes(tagId) ? ids : [...ids, tagId]));
    setBuscaTagSlash(null);
    tarefaInputRef.current?.focus();
  }

  function formularioNovaTarefa(grupo: Grupo) {
    return novaTarefaEm === grupo.origemId ? (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          padding: 10,
          background: cor.fundo,
          borderRadius: 10,
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          <select
            value=""
            onChange={(e) => {
              if (e.target.value) setTarefaTagIds((ids) => (ids.includes(e.target.value) ? ids : [...ids, e.target.value]));
            }}
            style={{ padding: 6, fontSize: 12, flex: "none" }}
            aria-label="Marcar tag de evento"
          >
            <option value="">+ Marcar tag de evento...</option>
            {tagsDisponiveis
              .filter((t) => !tarefaTagIds.includes(t.id))
              .map((t) => (
                <option key={t.id} value={t.id}>
                  {t.valor}
                </option>
              ))}
          </select>

          {/* Tags marcadas e o texto da tarefa na mesma barra — pedido do
             Caio: marcar as tags primeiro, elas aparecem aqui, e aí
             continua escrevendo depois delas. Também suporta digitar "/"
             no meio do texto pra abrir a busca de tag sem sair da barra. */}
          <div
            style={{
              position: "relative",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 6,
              flex: 1,
              minWidth: 200,
              padding: "4px 8px",
              border: `1px solid ${cor.borda}`,
              borderRadius: 8,
              background: "#fff",
            }}
          >
            {tarefaTagIds.map((id) => {
              const t = tagsDisponiveis.find((x) => x.id === id);
              if (!t) return null;
              const c = corEvento(t.id, t.cor);
              return (
                <span
                  key={id}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 11,
                    fontWeight: 600,
                    color: c.texto,
                    background: c.fundo,
                    borderRadius: 7,
                    padding: "2px 7px",
                    flex: "none",
                  }}
                >
                  {t.valor}
                  <button
                    type="button"
                    onClick={() => setTarefaTagIds((ids) => ids.filter((x) => x !== id))}
                    aria-label={`Remover ${t.valor}`}
                    style={{ border: "none", background: "transparent", color: c.texto, fontSize: 10, cursor: "pointer", padding: 0 }}
                  >
                    ×
                  </button>
                </span>
              );
            })}
            <input
              ref={tarefaInputRef}
              placeholder={tarefaTagIds.length === 0 ? "O que precisa ser feito? (digite / pra marcar um evento)" : "Continue escrevendo..."}
              value={tarefaLabel}
              onChange={(e) => aoDigitarTarefaLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setBuscaTagSlash(null);
              }}
              style={{ border: "none", outline: "none", flex: 1, minWidth: 120, padding: "4px 2px" }}
            />
            {buscaTagSlash !== null &&
              (() => {
                const sugestoes = tagsDisponiveis.filter(
                  (t) => !tarefaTagIds.includes(t.id) && t.valor.toLowerCase().includes(buscaTagSlash.toLowerCase()),
                );
                if (sugestoes.length === 0) return null;
                return (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      marginTop: 4,
                      background: "#fff",
                      border: `1px solid ${cor.borda}`,
                      borderRadius: 8,
                      boxShadow: "0 8px 20px rgba(32,31,29,.14)",
                      zIndex: 20,
                      minWidth: 200,
                      maxHeight: 180,
                      overflowY: "auto",
                      display: "flex",
                      flexDirection: "column",
                      padding: 4,
                    }}
                  >
                    {sugestoes.map((t) => {
                      const c = corEvento(t.id, t.cor);
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => selecionarTagViaSlash(t.id)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 7,
                            width: "100%",
                            textAlign: "left",
                            padding: "6px 10px",
                            border: "none",
                            background: "transparent",
                            borderRadius: 6,
                            fontSize: 12.5,
                            color: cor.texto,
                          }}
                        >
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: c.texto, flex: "none" }} />
                          {t.valor}
                        </button>
                      );
                    })}
                  </div>
                );
              })()}
          </div>

          <input type="date" value={tarefaData} onChange={(e) => setTarefaData(e.target.value)} style={{ padding: 6, flex: "none" }} />
          <button
            onClick={() => adicionarTarefa(grupo)}
            disabled={carregando === "nova-tarefa" || !tarefaLabel.trim()}
            style={{ ...botaoPrimario, fontSize: 11, padding: "6px 12px" }}
          >
            Salvar
          </button>
          <button
            onClick={() => {
              setNovaTarefaEm(null);
              setBuscaTagSlash(null);
            }}
            disabled={carregando === "nova-tarefa"}
            style={{ fontSize: 11 }}
          >
            Cancelar
          </button>
        </div>
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

  function alternarGrupo(origemId: string) {
    setGruposFechados((atual) => {
      const novo = new Set(atual);
      if (novo.has(origemId)) novo.delete(origemId);
      else novo.add(origemId);
      return novo;
    });
  }

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {grupos.map((grupo) => {
        const aberto = !gruposFechados.has(grupo.origemId);
        return (
          <div key={grupo.origemId} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <CabecalhoRecolhivel titulo={grupo.nome} aberto={aberto} onToggle={() => alternarGrupo(grupo.origemId)} />
              <div style={{ flex: 1 }}>
                <Progresso
                  concluidas={grupo.tarefas.filter((t) => t.concluida).length}
                  total={grupo.tarefas.length}
                />
              </div>
            </div>
            {aberto && (
              <>
                <ListaTarefas
                  tarefas={grupo.tarefas}
                  carregando={carregando}
                  onAlternar={alternar}
                  onAgendar={agendar}
                  onReordenar={reordenar}
                  onObservar={abrirObservacoes}
                />
                {formularioNovaTarefa(grupo)}
              </>
            )}
          </div>
        );
      })}

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
