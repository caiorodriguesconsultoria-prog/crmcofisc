"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { botaoPrimario, cor } from "@/lib/theme";

const KANBANS = [
  "Ofício de apresentação",
  "Aguardando entrega",
  "Aguardando assinatura",
  "Aguardando pagamento",
  "Aguardando Área Técnica",
];

type Tag = { id: string; valor: string };

export default function PainelProcesso({
  processoId,
  etapaAtual,
  tagsAtivas,
  tagsDisponiveis,
}: {
  processoId: string;
  etapaAtual: string;
  tagsAtivas: Tag[];
  tagsDisponiveis: Tag[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [kanban, setKanban] = useState(etapaAtual);
  const [novaTagId, setNovaTagId] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  const idsAtivas = new Set(tagsAtivas.map((t) => t.id));
  const opcoesParaAdicionar = tagsDisponiveis.filter((t) => !idsAtivas.has(t.id));

  async function salvarKanban() {
    setErro(null);
    setCarregando(true);
    const { error } = await supabase
      .from("processos")
      .update({ etapa_atual: kanban })
      .eq("id", processoId);
    setCarregando(false);
    if (error) {
      setErro(error.message);
      return;
    }
    router.refresh();
  }

  async function adicionarEvento() {
    if (!novaTagId) return;
    setErro(null);
    setCarregando(true);
    const { error } = await supabase
      .from("processo_tags")
      .insert({ processo_id: processoId, tag_id: novaTagId });
    setCarregando(false);
    if (error) {
      setErro(error.message);
      return;
    }
    setNovaTagId("");
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
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span
          style={{
            fontSize: 10.5,
            fontWeight: 500,
            textTransform: "uppercase",
            letterSpacing: 1,
            color: cor.textoTerciario,
          }}
        >
          Kanban atual
        </span>
        <div style={{ display: "flex", gap: 8 }}>
          <select value={kanban} onChange={(e) => setKanban(e.target.value)} style={{ padding: 8, flex: 1 }}>
            {KANBANS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
          <button onClick={salvarKanban} disabled={carregando || kanban === etapaAtual} style={botaoPrimario}>
            Salvar
          </button>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span
          style={{
            fontSize: 10.5,
            fontWeight: 500,
            textTransform: "uppercase",
            letterSpacing: 1,
            color: cor.textoTerciario,
          }}
        >
          Eventos ativos
        </span>
        {tagsAtivas.length === 0 ? (
          <span style={{ fontSize: 12.5, color: cor.textoTerciario }}>Nenhum</span>
        ) : (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {tagsAtivas.map((t) => (
              <span
                key={t.id}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: cor.destaque,
                  background: cor.destaqueFundo,
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
                    background: "rgba(125,84,17,.12)",
                    color: cor.destaque,
                  }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <select
            value={novaTagId}
            onChange={(e) => setNovaTagId(e.target.value)}
            style={{ padding: 8, flex: 1 }}
          >
            <option value="">Selecione um evento</option>
            {opcoesParaAdicionar.map((t) => (
              <option key={t.id} value={t.id}>
                {t.valor}
              </option>
            ))}
          </select>
          <button onClick={adicionarEvento} disabled={carregando || !novaTagId}>
            Adicionar
          </button>
        </div>
      </div>

      {erro && <p style={{ color: cor.urgente, margin: 0 }}>{erro}</p>}
    </div>
  );
}
