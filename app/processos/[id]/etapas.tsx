"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { botaoPrimario, cor } from "@/lib/theme";

export type Etapa = {
  id: string;
  nome: string;
  data: string | null;
  concluida: boolean;
};

function formatarData(data: string | null) {
  if (!data) return null;
  return new Date(`${data}T00:00:00`).toLocaleDateString("pt-BR");
}

// Lista de etapas do contrato (Empenho, Assinatura, Entrega...), cada uma
// com data opcional — independente da etapa única do Kanban (EtapaAtual,
// que continua controlando o quadro). Criadas na mão pelo Caio, uma a uma,
// igual já funciona no checklist de tarefas (sem lista padrão automática).
export default function Etapas({ processoId, etapas }: { processoId: string; etapas: Etapa[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState<string | null>(null);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [data, setData] = useState("");
  const [arrastandoId, setArrastandoId] = useState<string | null>(null);
  const [criando, setCriando] = useState(false);
  const [nomeNova, setNomeNova] = useState("");
  const [dataNova, setDataNova] = useState("");

  async function alternar(etapa: Etapa) {
    setErro(null);
    setCarregando(etapa.id);
    const { error } = await supabase
      .from("processo_etapas")
      .update({ concluida: !etapa.concluida })
      .eq("id", etapa.id);
    setCarregando(null);
    if (error) {
      setErro(error.message);
      return;
    }
    router.refresh();
  }

  function abrirEdicao(etapa: Etapa) {
    setEditandoId(etapa.id);
    setData(etapa.data ?? "");
  }

  async function salvarData(id: string) {
    setErro(null);
    const { error } = await supabase
      .from("processo_etapas")
      .update({ data: data || null })
      .eq("id", id);
    setEditandoId(null);
    if (error) setErro(error.message);
    else router.refresh();
  }

  function soltar(alvoId: string) {
    if (!arrastandoId || arrastandoId === alvoId) return;
    const lista = [...etapas];
    const origemIdx = lista.findIndex((e) => e.id === arrastandoId);
    const destinoIdx = lista.findIndex((e) => e.id === alvoId);
    if (origemIdx === -1 || destinoIdx === -1) return;
    const [movida] = lista.splice(origemIdx, 1);
    lista.splice(destinoIdx, 0, movida);
    setArrastandoId(null);
    reordenar(lista);
  }

  async function reordenar(lista: Etapa[]) {
    setErro(null);
    const resultados = await Promise.all(
      lista.map((e, i) => supabase.from("processo_etapas").update({ ordem: i + 1 }).eq("id", e.id)),
    );
    const falhou = resultados.find((r) => r.error);
    if (falhou?.error) {
      setErro(falhou.error.message);
      return;
    }
    router.refresh();
  }

  async function adicionar() {
    if (!nomeNova.trim()) return;
    setErro(null);
    setCarregando("nova-etapa");
    const { error } = await supabase.from("processo_etapas").insert({
      processo_id: processoId,
      nome: nomeNova.trim(),
      data: dataNova || null,
      ordem: etapas.length + 1,
    });
    setCarregando(null);
    if (error) {
      setErro(error.message);
      return;
    }
    setCriando(false);
    setNomeNova("");
    setDataNova("");
    router.refresh();
  }

  const concluidas = etapas.filter((e) => e.concluida).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {etapas.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ flex: 1, height: 4, borderRadius: 2, background: "rgba(32,31,29,.10)" }}>
            <div
              style={{
                height: "100%",
                borderRadius: 2,
                background: cor.positivo,
                width: `${Math.round((concluidas / etapas.length) * 100)}%`,
              }}
            />
          </div>
          <span style={{ fontSize: 11, fontWeight: 600, color: cor.textoTerciario, whiteSpace: "nowrap" }}>
            {concluidas}/{etapas.length}
          </span>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {etapas.map((e) => (
          <div key={e.id}>
            <div
              draggable
              onDragStart={() => setArrastandoId(e.id)}
              onDragOver={(ev) => ev.preventDefault()}
              onDrop={() => soltar(e.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                borderRadius: 10,
                padding: "7px 8px",
                opacity: arrastandoId === e.id ? 0.4 : carregando === e.id ? 0.6 : 1,
                background: e.concluida ? "rgba(126,155,126,.08)" : "transparent",
              }}
            >
              <span style={{ flex: "none", cursor: "grab", color: cor.textoTerciario, fontSize: 12 }}>⠿</span>
              <span
                onClick={() => (carregando ? null : alternar(e))}
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
                  background: e.concluida ? cor.positivo : "rgba(32,31,29,.18)",
                }}
              >
                {e.concluida ? "✓" : ""}
              </span>
              <span
                onClick={() => (carregando ? null : alternar(e))}
                style={{
                  flex: 1,
                  fontSize: 12.5,
                  cursor: carregando ? "default" : "pointer",
                  textDecoration: e.concluida ? "line-through" : "none",
                  color: e.concluida ? cor.textoTerciario : cor.texto,
                }}
              >
                {e.nome}
              </span>
              <button
                type="button"
                onClick={() => (editandoId === e.id ? setEditandoId(null) : abrirEdicao(e))}
                style={{
                  flex: "none",
                  fontSize: 10,
                  fontWeight: 600,
                  padding: "2px 7px",
                  border: "none",
                  borderRadius: 7,
                  color: formatarData(e.data) ? cor.destaque : cor.textoTerciario,
                  background: formatarData(e.data) ? cor.destaqueFundo : "rgba(96,93,93,.10)",
                }}
              >
                {formatarData(e.data) ?? "+ data"}
              </button>
            </div>
            {editandoId === e.id && (
              <div style={{ display: "flex", gap: 6, alignItems: "center", padding: "0 8px 8px 34px", flexWrap: "wrap" }}>
                <input type="date" value={data} onChange={(ev) => setData(ev.target.value)} style={{ padding: 5, fontSize: 12 }} />
                <button onClick={() => salvarData(e.id)} style={{ fontSize: 10.5, padding: "4px 10px" }}>
                  Salvar
                </button>
                {e.data && (
                  <button onClick={() => { setData(""); salvarData(e.id); }} style={{ fontSize: 10.5, padding: "4px 10px" }}>
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
        {etapas.length === 0 && !criando && (
          <p style={{ color: cor.textoTerciario, fontSize: 12.5, margin: 0 }}>Nenhuma etapa cadastrada ainda.</p>
        )}
      </div>

      {criando ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: 10, background: cor.fundo, borderRadius: 10, alignItems: "center" }}>
          <input
            placeholder="Nome da etapa (ex.: Empenho)"
            value={nomeNova}
            onChange={(e) => setNomeNova(e.target.value)}
            style={{ padding: 6, flex: 1, minWidth: 160 }}
          />
          <input type="date" value={dataNova} onChange={(e) => setDataNova(e.target.value)} style={{ padding: 6 }} />
          <button onClick={adicionar} disabled={carregando === "nova-etapa" || !nomeNova.trim()} style={{ ...botaoPrimario, fontSize: 11, padding: "6px 12px" }}>
            Salvar
          </button>
          <button onClick={() => setCriando(false)} disabled={carregando === "nova-etapa"} style={{ fontSize: 11 }}>
            Cancelar
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setCriando(true)}
          style={{ alignSelf: "flex-start", fontSize: 12, color: cor.textoTerciario, borderStyle: "dashed" }}
        >
          + Adicionar etapa
        </button>
      )}

      {erro && <p style={{ color: cor.urgente, margin: 0 }}>{erro}</p>}
    </div>
  );
}
