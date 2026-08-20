"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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
    <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <strong>Kanban atual</strong>
        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          <select
            value={kanban}
            onChange={(e) => setKanban(e.target.value)}
            style={{ padding: 8 }}
          >
            {KANBANS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
          <button onClick={salvarKanban} disabled={carregando || kanban === etapaAtual}>
            Salvar
          </button>
        </div>
      </div>

      <div>
        <strong>Eventos ativos</strong>
        <ul style={{ marginTop: 4 }}>
          {tagsAtivas.length === 0 && <li style={{ color: "#7D7979" }}>Nenhum</li>}
          {tagsAtivas.map((t) => (
            <li key={t.id}>
              {t.valor}{" "}
              <button onClick={() => removerEvento(t.id)} disabled={carregando}>
                remover
              </button>
            </li>
          ))}
        </ul>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <select
            value={novaTagId}
            onChange={(e) => setNovaTagId(e.target.value)}
            style={{ padding: 8 }}
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

      {erro && <p style={{ color: "#B0655C" }}>{erro}</p>}
    </div>
  );
}
