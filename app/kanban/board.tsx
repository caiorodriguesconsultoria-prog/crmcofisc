"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cor, sombraCard } from "@/lib/theme";

type Card = {
  id: string;
  numeroContrato: string;
  etapaAtual: string;
  coordenacaoSigla: string;
  fornecedorNome: string;
  tarefasTotal: number;
  tarefasConcluidas: number;
};

type Coluna = { nome: string; cards: Card[] };

export default function Board({ colunas, kanbans }: { colunas: Coluna[]; kanbans: string[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [carregando, setCarregando] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [colunaSobrevoada, setColunaSobrevoada] = useState<string | null>(null);

  async function moverPara(processoId: string, etapaAtual: string, novaEtapa: string) {
    if (novaEtapa === etapaAtual) return;

    setErro(null);
    setCarregando(processoId);
    const { error } = await supabase
      .from("processos")
      .update({ etapa_atual: novaEtapa })
      .eq("id", processoId);
    setCarregando(null);
    if (error) {
      setErro(error.message);
      return;
    }
    router.refresh();
  }

  async function concluirEtapa(processoId: string, etapaAtual: string) {
    const indiceAtual = kanbans.indexOf(etapaAtual);
    const proximaEtapa = kanbans[indiceAtual + 1];
    if (!proximaEtapa) return;
    await moverPara(processoId, etapaAtual, proximaEtapa);
  }

  return (
    <div style={{ marginTop: 16 }}>
      {erro && <p style={{ color: cor.urgente }}>{erro}</p>}
      <p style={{ fontSize: 12, color: cor.textoTerciario }}>Arraste um card pra qualquer coluna pra mover.</p>
      <div style={{ display: "flex", gap: 14, overflowX: "auto", alignItems: "flex-start", paddingBottom: 8 }}>
        {colunas.map((coluna) => (
          <div
            key={coluna.nome}
            onDragOver={(e) => {
              e.preventDefault();
              setColunaSobrevoada(coluna.nome);
            }}
            onDragLeave={() => setColunaSobrevoada((atual) => (atual === coluna.nome ? null : atual))}
            onDrop={(e) => {
              e.preventDefault();
              setColunaSobrevoada(null);
              const processoId = e.dataTransfer.getData("text/processo-id");
              const etapaAtual = e.dataTransfer.getData("text/etapa-atual");
              if (processoId) moverPara(processoId, etapaAtual, coluna.nome);
            }}
            style={{
              minWidth: 250,
              flex: "0 0 250px",
              background: colunaSobrevoada === coluna.nome ? "#EDE8E1" : cor.fundo,
              borderRadius: 14,
              padding: 10,
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 12.5, padding: "4px 6px 10px", color: cor.textoSecundario }}>
              {coluna.nome} ({coluna.cards.length})
            </div>
            {coluna.cards.map((card) => {
              const percentual =
                card.tarefasTotal > 0
                  ? Math.round((card.tarefasConcluidas / card.tarefasTotal) * 100)
                  : null;
              const temProxima = kanbans.indexOf(card.etapaAtual) < kanbans.length - 1;
              return (
                <div
                  key={card.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/processo-id", card.id);
                    e.dataTransfer.setData("text/etapa-atual", card.etapaAtual);
                  }}
                  style={{
                    background: cor.branco,
                    borderRadius: 12,
                    padding: 11,
                    marginBottom: 8,
                    boxShadow: sombraCard,
                    border: `1px solid ${cor.borda}`,
                    cursor: "grab",
                    opacity: carregando === card.id ? 0.5 : 1,
                  }}
                >
                  <Link href={`/processos/${card.id}`} style={{ fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
                    {card.numeroContrato}
                  </Link>
                  <div style={{ fontSize: 12, color: cor.textoSecundario, marginTop: 2 }}>
                    {card.coordenacaoSigla} · {card.fornecedorNome}
                  </div>
                  {percentual !== null && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ background: "rgba(32,31,29,.08)", borderRadius: 3, height: 6 }}>
                        <div
                          style={{
                            background: cor.positivo,
                            borderRadius: 3,
                            height: 6,
                            width: `${percentual}%`,
                          }}
                        />
                      </div>
                      <div style={{ fontSize: 10.5, color: cor.textoTerciario, marginTop: 3 }}>
                        {card.tarefasConcluidas}/{card.tarefasTotal} tarefas
                      </div>
                    </div>
                  )}
                  {temProxima && (
                    <button
                      onClick={() => concluirEtapa(card.id, card.etapaAtual)}
                      disabled={carregando === card.id}
                      style={{ marginTop: 8, fontSize: 11, padding: "5px 10px" }}
                    >
                      Concluir etapa
                    </button>
                  )}
                </div>
              );
            })}
            {coluna.cards.length === 0 && (
              <div style={{ fontSize: 12, color: cor.textoTerciario, padding: 6 }}>Nenhum processo</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
