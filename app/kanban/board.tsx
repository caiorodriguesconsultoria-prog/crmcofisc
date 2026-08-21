"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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

  async function concluirEtapa(processoId: string, etapaAtual: string) {
    const indiceAtual = kanbans.indexOf(etapaAtual);
    const proximaEtapa = kanbans[indiceAtual + 1];
    if (!proximaEtapa) return;

    setErro(null);
    setCarregando(processoId);
    const { error } = await supabase
      .from("processos")
      .update({ etapa_atual: proximaEtapa })
      .eq("id", processoId);
    setCarregando(null);
    if (error) {
      setErro(error.message);
      return;
    }
    router.refresh();
  }

  return (
    <div style={{ marginTop: 16 }}>
      {erro && <p style={{ color: "#B0655C" }}>{erro}</p>}
      <div style={{ display: "flex", gap: 12, overflowX: "auto", alignItems: "flex-start" }}>
        {colunas.map((coluna) => (
          <div
            key={coluna.nome}
            style={{
              minWidth: 240,
              flex: "0 0 240px",
              background: "#F5F4F3",
              borderRadius: 4,
              padding: 8,
            }}
          >
            <div style={{ fontWeight: "bold", fontSize: 13, padding: "4px 4px 8px" }}>
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
                  style={{
                    background: "#fff",
                    borderRadius: 4,
                    padding: 8,
                    marginBottom: 8,
                    boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                  }}
                >
                  <Link href={`/processos/${card.id}`} style={{ fontSize: 13, fontWeight: "bold" }}>
                    {card.numeroContrato}
                  </Link>
                  <div style={{ fontSize: 12, color: "#605D5D" }}>
                    {card.coordenacaoSigla} · {card.fornecedorNome}
                  </div>
                  {percentual !== null && (
                    <div style={{ marginTop: 6 }}>
                      <div style={{ background: "#e5e5e5", borderRadius: 2, height: 6 }}>
                        <div
                          style={{
                            background: "#7A9D7E",
                            borderRadius: 2,
                            height: 6,
                            width: `${percentual}%`,
                          }}
                        />
                      </div>
                      <div style={{ fontSize: 11, color: "#7D7979", marginTop: 2 }}>
                        {card.tarefasConcluidas}/{card.tarefasTotal} tarefas
                      </div>
                    </div>
                  )}
                  {temProxima && (
                    <button
                      onClick={() => concluirEtapa(card.id, card.etapaAtual)}
                      disabled={carregando === card.id}
                      style={{ marginTop: 8, fontSize: 12, padding: "4px 8px" }}
                    >
                      Concluir etapa
                    </button>
                  )}
                </div>
              );
            })}
            {coluna.cards.length === 0 && (
              <div style={{ fontSize: 12, color: "#7D7979", padding: 4 }}>Nenhum processo</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
