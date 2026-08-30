"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { botaoPrimario, cor } from "@/lib/theme";
import { corEvento } from "@/lib/cores-evento";

type Tag = { id: string; valor: string; cor?: string | null };

const rotuloSecao: React.CSSProperties = {
  fontSize: 10.5,
  fontWeight: 500,
  textTransform: "uppercase",
  letterSpacing: 1,
  color: cor.textoTerciario,
};

export function EtapaAtual({
  processoId,
  etapaAtual,
  etapasDisponiveis,
}: {
  processoId: string;
  etapaAtual: string;
  etapasDisponiveis: { id: string; nome: string }[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [etapa, setEtapa] = useState(etapaAtual);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [criandoNova, setCriandoNova] = useState(false);
  const [nomeNovaEtapa, setNomeNovaEtapa] = useState("");

  async function salvarEtapa() {
    setErro(null);
    setCarregando(true);
    const { error } = await supabase
      .from("processos")
      .update({ etapa_atual: etapa })
      .eq("id", processoId);
    setCarregando(false);
    if (error) {
      setErro(error.message);
      return;
    }
    router.refresh();
  }

  async function criarNovaEtapa() {
    if (!nomeNovaEtapa.trim()) return;
    setErro(null);
    setCarregando(true);
    const { error } = await supabase
      .from("kanban_colunas")
      .insert({ nome: nomeNovaEtapa.trim(), ordem: etapasDisponiveis.length });
    setCarregando(false);
    if (error) {
      setErro(error.message);
      return;
    }
    setEtapa(nomeNovaEtapa.trim());
    setNomeNovaEtapa("");
    setCriandoNova(false);
    router.refresh();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
      <span style={rotuloSecao}>Etapa atual</span>
      {criandoNova ? (
        <div style={{ display: "flex", gap: 8 }}>
          <input
            autoFocus
            value={nomeNovaEtapa}
            onChange={(e) => setNomeNovaEtapa(e.target.value)}
            placeholder="Nome da nova etapa"
            style={{ padding: 8, flex: 1, minWidth: 0 }}
          />
          <button onClick={criarNovaEtapa} disabled={carregando || !nomeNovaEtapa.trim()} style={botaoPrimario}>
            Criar
          </button>
          <button
            onClick={() => {
              setCriandoNova(false);
              setNomeNovaEtapa("");
            }}
            disabled={carregando}
          >
            Cancelar
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 8 }}>
          <select value={etapa} onChange={(e) => setEtapa(e.target.value)} style={{ padding: 8, flex: 1, minWidth: 0 }}>
            {etapasDisponiveis.map((e) => (
              <option key={e.id} value={e.nome}>
                {e.nome}
              </option>
            ))}
          </select>
          <button onClick={salvarEtapa} disabled={carregando || etapa === etapaAtual} style={botaoPrimario}>
            Salvar
          </button>
          <button onClick={() => setCriandoNova(true)} disabled={carregando}>
            + Nova
          </button>
        </div>
      )}
      {erro && <p style={{ color: cor.urgente, margin: 0 }}>{erro}</p>}
    </div>
  );
}

export function EventosAtivos({
  processoId,
  tagsAtivas,
  tagsDisponiveis,
}: {
  processoId: string;
  tagsAtivas: Tag[];
  tagsDisponiveis: Tag[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [novaTagId, setNovaTagId] = useState("");
  const [criandoNovo, setCriandoNovo] = useState(false);
  const [nomeNovoEvento, setNomeNovoEvento] = useState("");
  const [corNovoEvento, setCorNovoEvento] = useState("#2F5FDB");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  const idsAtivas = new Set(tagsAtivas.map((t) => t.id));
  const opcoesParaAdicionar = tagsDisponiveis.filter((t) => !idsAtivas.has(t.id));

  async function adicionarEvento(tagId: string) {
    if (!tagId) return;
    setErro(null);
    setCarregando(true);
    const { error } = await supabase
      .from("processo_tags")
      .insert({ processo_id: processoId, tag_id: tagId });
    setCarregando(false);
    if (error) {
      setErro(error.message);
      return;
    }
    setNovaTagId("");
    router.refresh();
  }

  async function criarNovoEvento() {
    if (!nomeNovoEvento.trim()) return;
    setErro(null);
    setCarregando(true);
    const { data: novaTag, error: erroTag } = await supabase
      .from("tags")
      .insert({ categoria: "evento", valor: nomeNovoEvento.trim(), ativo: true, cor: corNovoEvento })
      .select("id")
      .single();
    if (erroTag || !novaTag) {
      setCarregando(false);
      setErro(erroTag?.message ?? "Erro ao criar evento");
      return;
    }
    const { error: erroVinculo } = await supabase
      .from("processo_tags")
      .insert({ processo_id: processoId, tag_id: novaTag.id });
    setCarregando(false);
    if (erroVinculo) {
      setErro(erroVinculo.message);
      return;
    }
    setNomeNovoEvento("");
    setCriandoNovo(false);
    router.refresh();
  }

  async function removerEvento(tagId: string) {
    setErro(null);
    setCarregando(true);
    const { error } = await supabase
      .from("processo_tags")
      .delete()
      .eq("processo_id", processoId)
      .eq("tag_id", tagId);
    setCarregando(false);
    if (error) {
      setErro(error.message);
      return;
    }
    router.refresh();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
      <span style={rotuloSecao}>Eventos ativos</span>
      {tagsAtivas.length === 0 ? (
        <span style={{ fontSize: 12.5, color: cor.textoTerciario }}>Nenhum</span>
      ) : (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {tagsAtivas.map((t) => {
            const c = corEvento(t.id, t.cor);
            return (
              <span
                key={t.id}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: c.texto,
                  background: c.fundo,
                  borderRadius: 20,
                  padding: "5px 8px 5px 11px",
                }}
              >
                {t.valor}
                <button
                  onClick={() => removerEvento(t.id)}
                  disabled={carregando}
                  aria-label={`Remover ${t.valor}`}
                  style={{
                    fontSize: 10,
                    padding: "1px 6px",
                    border: "none",
                    background: "rgba(0,0,0,.08)",
                    color: c.texto,
                  }}
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>
      )}
      {criandoNovo ? (
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={nomeNovoEvento}
            onChange={(e) => setNomeNovoEvento(e.target.value)}
            placeholder="Nome do novo evento"
            style={{ padding: 8, flex: 1, minWidth: 0 }}
          />
          <input
            type="color"
            value={corNovoEvento}
            onChange={(e) => setCorNovoEvento(e.target.value)}
            title="Cor do evento"
            style={{ width: 38, padding: 2, flex: "none" }}
          />
          <button onClick={criarNovoEvento} disabled={carregando || !nomeNovoEvento.trim()}>
            Criar
          </button>
          <button onClick={() => { setCriandoNovo(false); setNomeNovoEvento(""); }} disabled={carregando}>
            Cancelar
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 8 }}>
          <select
            value={novaTagId}
            disabled={carregando}
            onChange={(e) => {
              setNovaTagId(e.target.value);
              adicionarEvento(e.target.value);
            }}
            style={{ padding: 8, flex: 1, minWidth: 0 }}
          >
            <option value="">Selecione um evento</option>
            {opcoesParaAdicionar.map((t) => (
              <option key={t.id} value={t.id}>
                {t.valor}
              </option>
            ))}
          </select>
          <button type="button" onClick={() => setCriandoNovo(true)} disabled={carregando} style={{ whiteSpace: "nowrap" }}>
            + Novo
          </button>
        </div>
      )}

      {erro && <p style={{ color: cor.urgente, margin: 0 }}>{erro}</p>}
    </div>
  );
}
