"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cor } from "@/lib/theme";
import { BotaoCopiar } from "@/app/_ui/campo";
import { corEvento } from "@/lib/cores-evento";

type Card = {
  id: string;
  numeroContrato: string;
  nup: string;
  objeto: string;
  etapaAtual: string;
  coordenacaoSigla: string;
  prazoData: string | null;
  dias: number | null;
  aguardando: { label: string; agendamentoData: string | null; agendamentoHorario: string | null } | null;
  emCobertura: boolean;
  nomeExibido: string;
  tags: { id: string; valor: string }[];
  agendamentos: { data: string; horario: string; rotulo: string | null }[];
};

type Coluna = { id: string; nome: string; ordem: number; cards: Card[] };

function corPrazo(dias: number | null) {
  if (dias === null) return null;
  if (dias <= 0) return cor.urgente;
  if (dias <= 7) return cor.atencao;
  return cor.positivo;
}

function textoPrazo(dias: number | null) {
  if (dias === null) return null;
  if (dias < 0) return "vencido";
  if (dias === 0) return "hoje";
  return `em ${dias} dias`;
}

function formatarData(data: string | null) {
  return data ? new Date(`${data}T00:00:00`).toLocaleDateString("pt-BR") : "";
}

export default function Board({ colunas }: { colunas: Coluna[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [carregando, setCarregando] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [colunaSobrevoada, setColunaSobrevoada] = useState<string | null>(null);
  const [criandoColuna, setCriandoColuna] = useState(false);
  const [nomeNovaColuna, setNomeNovaColuna] = useState("");

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

  async function reordenarColuna(colunaArrastadaId: string, colunaAlvoId: string) {
    if (colunaArrastadaId === colunaAlvoId) return;
    const semArrastada = colunas.filter((c) => c.id !== colunaArrastadaId);
    const indiceAlvo = semArrastada.findIndex((c) => c.id === colunaAlvoId);
    const arrastada = colunas.find((c) => c.id === colunaArrastadaId);
    if (!arrastada || indiceAlvo === -1) return;
    const novaOrdem = [...semArrastada.slice(0, indiceAlvo), arrastada, ...semArrastada.slice(indiceAlvo)];

    setErro(null);
    const { error } = await supabase.from("kanban_colunas").upsert(
      novaOrdem.map((c, i) => ({ id: c.id, nome: c.nome, ordem: i })),
    );
    if (error) {
      setErro(error.message);
      return;
    }
    router.refresh();
  }

  async function criarColuna() {
    if (!nomeNovaColuna.trim()) return;
    setErro(null);
    setCarregando("nova-coluna");
    const { error } = await supabase
      .from("kanban_colunas")
      .insert({ nome: nomeNovaColuna.trim(), ordem: colunas.length });
    setCarregando(null);
    if (error) {
      setErro(error.message);
      return;
    }
    setNomeNovaColuna("");
    setCriandoColuna(false);
    router.refresh();
  }

  return (
    <div style={{ marginTop: 16 }}>
      {erro && <p style={{ color: cor.urgente }}>{erro}</p>}
      <p style={{ fontSize: 12, color: cor.textoTerciario }}>
        Arraste um card pra qualquer coluna pra mover. Arraste o título de uma coluna pra reordenar.
      </p>
      <div style={{ display: "flex", gap: 14, overflowX: "auto", alignItems: "flex-start", paddingBottom: 8 }}>
        {colunas.map((coluna) => (
          <div
            key={coluna.id}
            onDragOver={(e) => {
              e.preventDefault();
              setColunaSobrevoada(coluna.nome);
            }}
            onDragLeave={() => setColunaSobrevoada((atual) => (atual === coluna.nome ? null : atual))}
            onDrop={(e) => {
              e.preventDefault();
              setColunaSobrevoada(null);
              const colunaArrastadaId = e.dataTransfer.getData("text/coluna-id");
              if (colunaArrastadaId) {
                reordenarColuna(colunaArrastadaId, coluna.id);
                return;
              }
              const processoId = e.dataTransfer.getData("text/processo-id");
              const etapaAtual = e.dataTransfer.getData("text/etapa-atual");
              if (processoId) moverPara(processoId, etapaAtual, coluna.nome);
            }}
            style={{
              minWidth: 260,
              flex: "0 0 260px",
              background: colunaSobrevoada === coluna.nome ? "#EDE8E1" : cor.fundo,
              borderRadius: 14,
              padding: 10,
            }}
          >
            <div
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("text/coluna-id", coluna.id);
              }}
              style={{
                fontWeight: 700,
                fontSize: 12.5,
                padding: "4px 6px 10px",
                color: cor.textoSecundario,
                cursor: "grab",
              }}
            >
              {coluna.nome} ({coluna.cards.length})
            </div>
            {coluna.cards.map((card) => {
              const dot = corPrazo(card.dias);
              return (
                <div
                  key={card.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/processo-id", card.id);
                    e.dataTransfer.setData("text/etapa-atual", card.etapaAtual);
                  }}
                  style={{
                    background: card.emCobertura
                      ? "linear-gradient(180deg,#FCF7EE,#F4EADA)"
                      : "linear-gradient(180deg,#fff,#F8F4F4)",
                    borderRadius: 14,
                    padding: "13px 14px",
                    marginBottom: 8,
                    boxShadow: card.emCobertura
                      ? "0 1px 2px rgba(120,95,45,.16), 0 10px 24px rgba(120,95,45,.14)"
                      : "0 1px 2px rgba(0,0,0,.07), 0 10px 24px rgba(0,0,0,.08)",
                    cursor: "grab",
                    opacity: carregando === card.id ? 0.5 : 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Link href={`/processos/${card.id}`} style={{ fontSize: 14, fontWeight: 700, textDecoration: "none" }}>
                        {card.numeroContrato}
                      </Link>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2, minWidth: 0 }}>
                        <span
                          title={card.nup}
                          style={{
                            fontSize: 11,
                            color: cor.textoSecundario,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            minWidth: 0,
                          }}
                        >
                          {card.nup}
                        </span>
                        <BotaoCopiar texto={card.nup} />
                      </div>
                    </div>
                    <span
                      style={{
                        flex: "none",
                        fontSize: 10.5,
                        fontWeight: 600,
                        padding: "3px 8px",
                        borderRadius: 8,
                        color: cor.destaque,
                        background: cor.destaqueFundo,
                      }}
                    >
                      {card.coordenacaoSigla}
                    </span>
                  </div>

                  <div style={{ fontSize: 12.5, lineHeight: 1.4, color: cor.texto }}>{card.objeto}</div>

                  {card.tags.length > 0 && (
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {card.tags.map((t) => {
                        const c = corEvento(t.id);
                        return (
                          <span
                            key={t.id}
                            style={{
                              fontSize: 10,
                              fontWeight: 600,
                              color: c.texto,
                              background: c.fundo,
                              borderRadius: 7,
                              padding: "2px 7px",
                            }}
                          >
                            {t.valor}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {card.emCobertura && (
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 10.5, fontWeight: 600, color: "#8A6A3B", background: "rgba(182,130,53,.10)", borderRadius: 7, padding: "3px 8px" }}>
                        Cobertura de férias
                      </span>
                      {card.nomeExibido && (
                        <span style={{ fontSize: 10.5, fontWeight: 600, color: cor.textoSecundario, background: "rgba(96,93,93,.12)", borderRadius: 7, padding: "3px 8px" }}>
                          {card.nomeExibido}
                        </span>
                      )}
                    </div>
                  )}

                  {(card.dias !== null || card.agendamentos.length > 0) && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      {card.dias !== null && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 600, color: dot ?? undefined }}>
                          <span style={{ width: 7, height: 7, borderRadius: "50%", background: dot ?? undefined, flex: "none" }} />
                          {formatarData(card.prazoData)} · {textoPrazo(card.dias)}
                        </div>
                      )}
                      {card.agendamentos.map((a, i) => (
                        <span
                          key={i}
                          title={a.rotulo ?? undefined}
                          style={{
                            fontSize: 10,
                            fontWeight: 600,
                            color: cor.destaque,
                            background: cor.destaqueFundo,
                            borderRadius: 7,
                            padding: "2px 7px",
                          }}
                        >
                          {formatarData(a.data)} {a.horario.slice(0, 5)}
                          {a.rotulo ? ` · ${a.rotulo}` : ""}
                        </span>
                      ))}
                    </div>
                  )}

                  {card.aguardando && (
                    <div style={{ fontSize: 11.5, color: cor.textoTerciario }}>
                      Aguarda: {card.aguardando.label}
                      {card.aguardando.agendamentoData && (
                        <div style={{ fontSize: 11, color: cor.destaque, fontWeight: 600, marginTop: 2 }}>
                          {formatarData(card.aguardando.agendamentoData)}
                          {card.aguardando.agendamentoHorario ? ` ${card.aguardando.agendamentoHorario.slice(0, 5)}` : ""}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {coluna.cards.length === 0 && (
              <div style={{ fontSize: 12, color: cor.textoTerciario, padding: 6 }}>Nenhum processo</div>
            )}
          </div>
        ))}

        <div style={{ minWidth: 220, flex: "0 0 220px" }}>
          {criandoColuna ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, background: cor.fundo, borderRadius: 14, padding: 10 }}>
              <input
                autoFocus
                value={nomeNovaColuna}
                onChange={(e) => setNomeNovaColuna(e.target.value)}
                placeholder="Nome da coluna"
                style={{ padding: 8 }}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={criarColuna} disabled={carregando === "nova-coluna" || !nomeNovaColuna.trim()}>
                  Criar
                </button>
                <button
                  onClick={() => {
                    setCriandoColuna(false);
                    setNomeNovaColuna("");
                  }}
                  disabled={carregando === "nova-coluna"}
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setCriandoColuna(true)}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 14,
                border: "1px dashed rgba(0,0,0,.18)",
                background: "transparent",
                color: cor.textoSecundario,
                fontSize: 12.5,
                fontWeight: 600,
                textAlign: "left",
              }}
            >
              + Nova coluna
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
