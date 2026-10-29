"use client";

import { useState } from "react";
import Link from "next/link";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Sparkles } from "lucide-react";
import { card, cor, PALETA_EVENTOS } from "@/lib/theme";
import { corEvento } from "@/lib/cores-evento";
import { corEtapa } from "@/lib/cor-etapa";
import MedidorCircular from "@/app/_ui/medidor-circular";
import { BotaoCopiar } from "@/app/_ui/campo";
import CardBento from "@/app/_ui/card-bento";
import Kpi from "@/app/_ui/kpi";
import IndicadorUrgencia, { type NivelUrgencia } from "@/app/_ui/indicador-urgencia";
import TagRotulo from "@/app/_ui/tag-rotulo";

type Processo = {
  id: string;
  numeroContrato: string;
  etapaAtual: string;
  diasParado: number | null;
};

type ItemAtividade = { rotulo: string; horario: string | null; periodo?: "manha" | "tarde" | null };

type ProcessoAtividadeHoje = {
  id: string;
  numeroContrato: string;
  nup: string;
  objeto: string;
  etapaAtual: string;
  tags: { id: string; valor: string; cor: string | null }[];
  itens: ItemAtividade[];
};

type Evento = { id: string; valor: string; cor: string | null };
type Etapa = { id: string; nome: string };
type EntregaEmAtraso = { id: string; processoId: string; numeroContrato: string; numeroParcela: number; dias: number };
type PrazoDaSemana = { id: string; numeroContrato: string; prazoData: string; dias: number };

const grade: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(88px, 1fr))",
  gap: 14,
  marginTop: 10,
};

function nivelUrgenciaPorDias(dias: number): NivelUrgencia {
  if (dias <= 2) return "critico";
  if (dias <= 5) return "atencao";
  return "ok";
}

export default function PainelDashboard({
  processos,
  contagemPorEtapa,
  contagemPorEvento,
  ativos,
  concluidos,
  vencendoHoje,
  vencemEm7Dias,
  comOcorrencia,
  emCoberturaFerias,
  acaoDoDia,
  prazosDaSemana,
  divisaoPorCoordenacao,
  processosAtividadeHoje,
  entregasEmAtraso,
  eventos,
  etapas,
}: {
  processos: Processo[];
  contagemPorEtapa: Record<string, number>;
  contagemPorEvento: Record<string, number>;
  ativos: number;
  concluidos: number;
  vencendoHoje: number;
  vencemEm7Dias: number;
  comOcorrencia: number;
  emCoberturaFerias: number;
  acaoDoDia: { texto: string; href: string } | null;
  prazosDaSemana: PrazoDaSemana[];
  divisaoPorCoordenacao: { sigla: string; total: number }[];
  processosAtividadeHoje: ProcessoAtividadeHoje[];
  entregasEmAtraso: EntregaEmAtraso[];
  eventos: Evento[];
  etapas: Etapa[];
}) {
  const [limiteDias, setLimiteDias] = useState(15);

  const parados = processos
    .filter((p) => p.diasParado !== null && p.diasParado >= limiteDias)
    .sort((a, b) => (b.diasParado ?? 0) - (a.diasParado ?? 0));

  const dadosEtapas = etapas.map((et) => ({ nome: et.nome, total: contagemPorEtapa[et.nome] ?? 0 }));

  return (
    <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 16 }}>
      <CardBento indice={0}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 24 }}>
          <Kpi rotulo="Contratos ativos" valor={ativos} />
          <Kpi
            rotulo="Vencem em 7 dias"
            valor={vencemEm7Dias}
            variacao={vencemEm7Dias > 0 ? { texto: "atenção à agenda", sentido: "negativo" } : undefined}
          />
          <Kpi rotulo="Com ocorrência" valor={comOcorrencia} />
          <Kpi
            rotulo="Vencendo hoje"
            valor={vencendoHoje}
            variacao={vencendoHoje > 0 ? { texto: "agir hoje", sentido: "negativo" } : undefined}
          />
          <Link href="/processos/concluidos" style={{ textDecoration: "none" }}>
            <Kpi rotulo="Concluídos" valor={concluidos} />
          </Link>
        </div>
      </CardBento>

      {acaoDoDia && (
        <Link href={acaoDoDia.href} style={{ textDecoration: "none" }}>
          <CardBento indice={1} clicavel style={{ background: cor.escuro, color: "#fff" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: cor.destaqueQuenteFundo,
                  color: cor.destaqueQuente,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flex: "none",
                }}
              >
                <Sparkles size={18} />
              </span>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, color: "rgba(255,255,255,.6)" }}>
                  Ação do dia
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, marginTop: 2 }}>{acaoDoDia.texto}</div>
              </div>
            </div>
          </CardBento>
        </Link>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
        <CardBento titulo="Contratos por etapa" indice={2}>
          <div style={{ width: "100%", height: 220 }}>
            <ResponsiveContainer>
              <BarChart data={dadosEtapas} margin={{ left: -20 }}>
                <XAxis dataKey="nome" tick={{ fontSize: 10.5, fill: cor.textoTerciario }} interval={0} angle={-20} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 11, fill: cor.textoTerciario }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: cor.escuro, border: "none", borderRadius: 10, color: "#fff", fontSize: 12.5 }}
                  itemStyle={{ color: "#fff" }}
                  cursor={{ fill: cor.fundo }}
                />
                <Bar dataKey="total" fill={cor.destaque} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardBento>

        <CardBento titulo="Prazos da semana" subtitulo="Contratos ativos com prazo nos próximos 7 dias" indice={3}>
          {prazosDaSemana.length === 0 ? (
            <p style={{ color: cor.textoTerciario, fontSize: 13, margin: 0 }}>Nenhum prazo nos próximos 7 dias.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {prazosDaSemana.map((p) => (
                <Link
                  key={p.id}
                  href={`/processos/${p.id}`}
                  style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: cor.texto, fontSize: 13 }}
                >
                  <strong style={{ flex: "none" }}>{p.numeroContrato}</strong>
                  <span style={{ marginLeft: "auto" }}>
                    <IndicadorUrgencia
                      nivel={nivelUrgenciaPorDias(p.dias)}
                      texto={p.dias === 0 ? "vence hoje" : `${p.dias} dia${p.dias > 1 ? "s" : ""}`}
                    />
                  </span>
                </Link>
              ))}
            </div>
          )}
        </CardBento>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
        <CardBento titulo="Agenda de hoje" subtitulo="Contratos com tarefa ou agendamento marcado pra hoje" indice={4}>
          {processosAtividadeHoje.length === 0 ? (
            <p style={{ color: cor.textoTerciario, fontSize: 13, margin: 0 }}>Nenhuma atividade marcada pra hoje.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ textAlign: "left", borderBottom: `1px solid ${cor.borda}` }}>
                    <th style={{ padding: "8px 10px", fontSize: 11.5 }}>Contrato</th>
                    <th style={{ padding: "8px 10px", fontSize: 11.5 }}>NUP</th>
                    <th style={{ padding: "8px 10px", fontSize: 11.5 }}>Objeto</th>
                    <th style={{ padding: "8px 10px", fontSize: 11.5 }}>Etapa</th>
                    <th style={{ padding: "8px 10px", fontSize: 11.5 }}>Eventos</th>
                    <th style={{ padding: "8px 10px", fontSize: 11.5 }}>Hoje</th>
                  </tr>
                </thead>
                <tbody>
                  {processosAtividadeHoje.map((p) => (
                    <tr key={p.id} style={{ borderBottom: `1px solid ${cor.borda}` }}>
                      <td style={{ padding: "9px 10px" }}>
                        <Link href={`/processos/${p.id}`} style={{ fontWeight: 600, textDecoration: "none" }}>
                          {p.numeroContrato}
                        </Link>
                      </td>
                      <td style={{ padding: "9px 10px", fontSize: 12.5 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          {p.nup}
                          <BotaoCopiar texto={p.nup} />
                        </div>
                      </td>
                      <td style={{ padding: "9px 10px", fontSize: 12.5 }}>{p.objeto}</td>
                      <td style={{ padding: "9px 10px" }}>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            padding: "3px 9px",
                            borderRadius: 20,
                            background: corEtapa(p.etapaAtual).fundo,
                            color: corEtapa(p.etapaAtual).texto,
                          }}
                        >
                          {p.etapaAtual}
                        </span>
                      </td>
                      <td style={{ padding: "9px 10px" }}>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                          {p.tags.map((t) => {
                            const c = corEvento(t.id, t.cor);
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
                      </td>
                      <td style={{ padding: "9px 10px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                          {p.itens.map((item, i) => (
                            <span key={i} style={{ fontSize: 12 }}>
                              {item.horario
                                ? `${item.horario.slice(0, 5)} · `
                                : item.periodo
                                  ? `${item.periodo === "manha" ? "Manhã" : "Tarde"} · `
                                  : ""}
                              {item.rotulo}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBento>

        <CardBento titulo="Divisão por coordenação" subtitulo="Contratos ativos" indice={5}>
          {divisaoPorCoordenacao.length === 0 ? (
            <p style={{ color: cor.textoTerciario, fontSize: 13, margin: 0 }}>Nenhum contrato ativo.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {divisaoPorCoordenacao.map((c) => (
                <div key={c.sigla} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <TagRotulo texto={c.sigla} />
                  <div style={{ flex: 1, height: 6, borderRadius: 3, background: cor.fundo, overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${Math.round((c.total / Math.max(1, divisaoPorCoordenacao[0].total)) * 100)}%`,
                        background: cor.destaque,
                        borderRadius: 3,
                      }}
                    />
                  </div>
                  <strong style={{ fontSize: 13, flex: "none" }}>{c.total}</strong>
                </div>
              ))}
            </div>
          )}
        </CardBento>
      </div>

      {entregasEmAtraso.length > 0 && (
        <div style={{ ...card, background: cor.urgenteFundo, border: "none", borderLeft: `4px solid ${cor.urgente}` }}>
          <strong style={{ fontSize: 13, color: cor.urgente }}>Entregas em atraso</strong>
          <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
            {entregasEmAtraso.map((e) => (
              <Link
                key={e.id}
                href={`/processos/${e.processoId}`}
                style={{ fontSize: 12.5, color: cor.urgente, textDecoration: "none", fontWeight: 600 }}
              >
                CT {e.numeroContrato} - {e.numeroParcela}ª Parcela — {e.dias} dia{e.dias > 1 ? "s" : ""} em atraso
              </Link>
            ))}
          </div>
        </div>
      )}

      <div style={card}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <strong style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: cor.atencao }} />
            Contratos parados
          </strong>
          <label style={{ marginLeft: "auto", fontSize: 12, color: cor.textoTerciario }}>
            a partir de{" "}
            <input
              type="number"
              min={1}
              value={limiteDias}
              onChange={(e) => setLimiteDias(Number(e.target.value) || 1)}
              style={{ width: 50, padding: 4, borderRadius: 6, border: `1px solid ${cor.borda}` }}
            />{" "}
            dias na mesma etapa
          </label>
        </div>
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
          {parados.length === 0 && (
            <p style={{ color: cor.textoTerciario, fontSize: 13, margin: 0 }}>
              Nenhum contrato parado além do limite.
            </p>
          )}
          {parados.map((p) => (
            <Link
              key={p.id}
              href={`/processos/${p.id}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 11px",
                borderRadius: 12,
                background: cor.atencaoFundo,
                textDecoration: "none",
                color: cor.texto,
                fontSize: 12.5,
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: cor.urgente, flex: "none" }} />
              <strong>{p.numeroContrato}</strong>
              <span style={{ color: cor.textoTerciario }}>{p.etapaAtual}</span>
              <span style={{ marginLeft: "auto", color: cor.textoTerciario }}>há {p.diasParado} dias</span>
            </Link>
          ))}
        </div>
      </div>

      <div style={card}>
        <strong style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: cor.laranja }} />
          Contratos por etapa e evento
        </strong>
        <p style={{ fontSize: 12, color: cor.textoTerciario, margin: "2px 0 12px" }}>
          Cada etapa e cada evento é um medidor à parte, com seu próprio total — um
          contrato está em uma única etapa, mas pode ter vários eventos ao mesmo tempo.
        </p>

        <span style={{ fontSize: 10.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6, color: cor.textoTerciario }}>
          Etapas
        </span>
        <div style={grade}>
          {etapas.map((et, i) => {
            const c = PALETA_EVENTOS[i % PALETA_EVENTOS.length];
            return (
              <MedidorCircular
                key={et.id}
                valor={contagemPorEtapa[et.nome] ?? 0}
                total={processos.length}
                corPreenchido={c.texto}
                corTrilha={c.fundo}
                rotulo={et.nome}
                tamanho={80}
              />
            );
          })}
        </div>

        <span style={{ display: "block", marginTop: 20, fontSize: 10.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6, color: cor.textoTerciario }}>
          Eventos
        </span>
        <div style={grade}>
          {eventos.map((ev) => {
            const c = corEvento(ev.id, ev.cor);
            return (
              <MedidorCircular
                key={ev.id}
                valor={contagemPorEvento[ev.id] ?? 0}
                total={processos.length}
                corPreenchido={c.texto}
                corTrilha={c.fundo}
                rotulo={ev.valor}
                tamanho={80}
              />
            );
          })}
        </div>

        <span style={{ display: "block", marginTop: 20, fontSize: 10.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6, color: cor.textoTerciario }}>
          Cobertura
        </span>
        <div style={grade}>
          <MedidorCircular
            valor={emCoberturaFerias}
            total={processos.length}
            corPreenchido={cor.atencao}
            corTrilha={cor.atencaoFundo}
            rotulo="Cobertura de férias"
            tamanho={80}
          />
        </div>
      </div>
    </div>
  );
}
