"use client";

import { useState } from "react";
import Link from "next/link";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Sparkles } from "lucide-react";
import { card, cor, PALETA_VIVA } from "@/lib/theme";
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

function nivelUrgenciaPorDias(dias: number): NivelUrgencia {
  if (dias <= 2) return "critico";
  if (dias <= 5) return "atencao";
  return "ok";
}

// Tooltip escuro padrão dos gráficos do Painel — só o nome e o valor, sem
// nenhuma legenda fixa na tela (pedido do Caio: "não precisa colocar os
// nomes nas cores, ao passar o mouse em cima o nome aparece").
function TooltipPizza({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div style={{ background: cor.escuro, color: "#fff", borderRadius: 10, padding: "6px 10px", fontSize: 12.5 }}>
      <strong>{item.name}</strong>: {item.value}
    </div>
  );
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
  acaoDoDia: { texto: string; href: string; entregaDestacadaId?: string } | null;
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

  const dadosEtapas = etapas
    .map((et) => ({ nome: et.nome, valor: contagemPorEtapa[et.nome] ?? 0 }))
    .filter((d) => d.valor > 0);

  const dadosEventos = eventos
    .map((ev) => ({ nome: ev.valor, valor: contagemPorEvento[ev.id] ?? 0, cor: corEvento(ev.id, ev.cor).texto }))
    .filter((d) => d.valor > 0);

  // Fundo do card em branco plano, igual a todos os outros cards do
  // sistema — cada KPI tinha um fundo colorido/degradê diferente (5 tons de
  // "chrome" diferentes na mesma tela), que é exatamente o padrão que a
  // auditoria de design pede pra evitar: cor deve ficar no conteúdo (o
  // número, via corNumero), não espalhada pelo fundo do card.
  const kpis = [
    { rotulo: "Contratos ativos", valor: ativos, corNumero: cor.azulEscuro },
    {
      rotulo: "Vencem em 7 dias",
      valor: vencemEm7Dias,
      corNumero: cor.laranja,
      variacao: vencemEm7Dias > 0 ? { texto: "atenção à agenda", sentido: "negativo" as const } : undefined,
    },
    { rotulo: "Com ocorrência", valor: comOcorrencia, corNumero: cor.destaqueQuente },
    {
      rotulo: "Vencendo hoje",
      valor: vencendoHoje,
      corNumero: cor.vermelhoEscuro,
      variacao: vencendoHoje > 0 ? { texto: "agir hoje", sentido: "negativo" as const } : undefined,
    },
    { rotulo: "Concluídos", valor: concluidos, corNumero: cor.verdeEscuro, href: "/processos/concluidos" },
  ];

  return (
    <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        {kpis.map((k, i) => {
          const conteudo = (
            <CardBento key={k.rotulo} indice={i} pequeno clicavel={!!k.href} corAcento={PALETA_VIVA[i % PALETA_VIVA.length]} vidroClaro>
              <Kpi rotulo={k.rotulo} valor={k.valor} corNumero={k.corNumero} variacao={k.variacao} />
            </CardBento>
          );
          return k.href ? (
            <Link key={k.rotulo} href={k.href} style={{ textDecoration: "none" }}>
              {conteudo}
            </Link>
          ) : (
            conteudo
          );
        })}
      </div>

      {acaoDoDia && (
        <Link href={acaoDoDia.href} style={{ textDecoration: "none" }}>
          <CardBento indice={1} clicavel vidroClaro corAcento={cor.destaqueQuente}>
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
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, color: cor.textoTerciario }}>
                  Ação do dia
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, marginTop: 2, color: cor.texto }}>{acaoDoDia.texto}</div>
              </div>
            </div>
          </CardBento>
        </Link>
      )}

      <div>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: cor.texto, margin: "0 0 2px" }}>Agenda de hoje</h2>
        <p style={{ fontSize: 12.5, color: cor.textoTerciario, margin: "0 0 12px" }}>Contratos com tarefa ou agendamento marcado pra hoje</p>
        {processosAtividadeHoje.length === 0 ? (
          <p style={{ color: cor.textoTerciario, fontSize: 13, margin: 0 }}>Nenhuma atividade marcada pra hoje.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {processosAtividadeHoje.map((p, i) => (
              <CardBento key={p.id} indice={i} vidroClaro corAcento={PALETA_VIVA[i % PALETA_VIVA.length]}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                    <Link
                      href={`/processos/${p.id}`}
                      className="crm-pilula-hover"
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        textDecoration: "none",
                        padding: "4px 10px",
                        borderRadius: 999,
                        background: cor.destaqueFundo,
                        color: cor.destaque,
                      }}
                    >
                      {p.numeroContrato}
                    </Link>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: "3px 9px",
                        borderRadius: 20,
                        background: corEtapa(p.etapaAtual).fundo,
                        color: corEtapa(p.etapaAtual).texto,
                        flex: "none",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {p.etapaAtual}
                    </span>
                  </div>
                  <p style={{ fontSize: 12.5, color: cor.texto, margin: 0, lineHeight: 1.4 }}>{p.objeto}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: cor.textoSecundario }}>
                    <span style={{ fontVariantNumeric: "tabular-nums" }}>{p.nup}</span>
                    <BotaoCopiar texto={p.nup} />
                  </div>
                  {p.tags.length > 0 && (
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {p.tags.map((t) => {
                        const c = corEvento(t.id, t.cor);
                        return (
                          <span
                            key={t.id}
                            style={{ fontSize: 10.5, fontWeight: 600, color: c.texto, background: c.fundo, borderRadius: 7, padding: "2px 7px" }}
                          >
                            {t.valor}
                          </span>
                        );
                      })}
                    </div>
                  )}
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, borderTop: `1px solid ${cor.borda}`, paddingTop: 8 }}>
                    {p.itens.map((item, idx) => (
                      <span key={idx} style={{ fontSize: 12, color: cor.texto }}>
                        {item.horario
                          ? `${item.horario.slice(0, 5)} · `
                          : item.periodo
                            ? `${item.periodo === "manha" ? "Manhã" : "Tarde"} · `
                            : ""}
                        {item.rotulo}
                      </span>
                    ))}
                  </div>
                </div>
              </CardBento>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: cor.texto, margin: "0 0 2px" }}>Prazos da semana</h2>
        <p style={{ fontSize: 12.5, color: cor.textoTerciario, margin: "0 0 12px" }}>Contratos ativos com prazo nos próximos 7 dias</p>
        {prazosDaSemana.length === 0 ? (
          <p style={{ color: cor.textoTerciario, fontSize: 13, margin: 0 }}>Nenhum prazo nos próximos 7 dias.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
            {prazosDaSemana.map((p, i) => (
              <Link key={p.id} href={`/processos/${p.id}`} style={{ textDecoration: "none" }}>
                <CardBento indice={i} clicavel vidroClaro corAcento={PALETA_VIVA[i % PALETA_VIVA.length]}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <strong style={{ fontSize: 15, color: cor.texto, fontVariantNumeric: "tabular-nums" }}>{p.numeroContrato}</strong>
                    <IndicadorUrgencia
                      nivel={nivelUrgenciaPorDias(p.dias)}
                      texto={p.dias === 0 ? "vence hoje" : `${p.dias} dia${p.dias > 1 ? "s" : ""}`}
                    />
                  </div>
                </CardBento>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: cor.texto, margin: "0 0 2px" }}>Divisão por coordenação</h2>
        <p style={{ fontSize: 12.5, color: cor.textoTerciario, margin: "0 0 12px" }}>Contratos ativos</p>
        {divisaoPorCoordenacao.length === 0 ? (
          <p style={{ color: cor.textoTerciario, fontSize: 13, margin: 0 }}>Nenhum contrato ativo.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 16 }}>
            {divisaoPorCoordenacao.map((c, i) => (
              <CardBento key={c.sigla} indice={i} pequeno vidroClaro corAcento={PALETA_VIVA[i % PALETA_VIVA.length]}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <TagRotulo texto={c.sigla} corTexto={PALETA_VIVA[i % PALETA_VIVA.length]} />
                  <strong style={{ fontSize: 28, fontWeight: 700, color: cor.texto, fontVariantNumeric: "tabular-nums" }}>{c.total}</strong>
                  <div style={{ height: 6, borderRadius: 3, background: cor.borda, overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${Math.round((c.total / Math.max(1, divisaoPorCoordenacao[0].total)) * 100)}%`,
                        background: PALETA_VIVA[i % PALETA_VIVA.length],
                        borderRadius: 3,
                      }}
                    />
                  </div>
                </div>
              </CardBento>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
        <CardBento titulo="Contratos por etapa" indice={0} corAcento={PALETA_VIVA[0]} vidroClaro>
          {dadosEtapas.length === 0 ? (
            <p style={{ color: cor.textoTerciario, fontSize: 13, margin: 0 }}>Nenhum contrato ativo.</p>
          ) : (
            <div style={{ width: "100%", height: 260 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={dadosEtapas} dataKey="valor" nameKey="nome" innerRadius="55%" outerRadius="88%" paddingAngle={2}>
                    {dadosEtapas.map((_, i) => (
                      <Cell key={i} fill={PALETA_VIVA[i % PALETA_VIVA.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip content={<TooltipPizza />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardBento>

        <CardBento titulo="Eventos" subtitulo="Quantos contratos ativos têm cada evento agora" indice={1} corAcento={PALETA_VIVA[1]} vidroClaro>
          {dadosEventos.length === 0 ? (
            <p style={{ color: cor.textoTerciario, fontSize: 13, margin: 0 }}>Nenhum evento ativo no momento.</p>
          ) : (
            <div style={{ width: "100%", height: 260 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={dadosEventos} dataKey="valor" nameKey="nome" innerRadius="55%" outerRadius="88%" paddingAngle={2}>
                    {dadosEventos.map((d, i) => (
                      <Cell key={i} fill={d.cor} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip content={<TooltipPizza />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          <div style={{ marginTop: 10, display: "flex", justifyContent: "center" }}>
            <MedidorCircular
              valor={emCoberturaFerias}
              total={processos.length}
              corPreenchido={cor.atencao}
              corTrilha={cor.atencaoFundo}
              rotulo="Cobertura de férias"
              tamanho={72}
            />
          </div>
        </CardBento>
      </div>

      {(() => {
        // A entrega já destacada em "Ação do dia" (acima) não repete aqui —
        // pedido do Caio depois de ver as duas num mesmo print.
        const entregasRestantes = entregasEmAtraso.filter((e) => e.id !== acaoDoDia?.entregaDestacadaId);
        return entregasRestantes.length > 0 && (
        <div style={{ ...card, background: cor.urgenteFundo, border: "none", borderLeft: `4px solid ${cor.urgente}` }}>
          <strong style={{ fontSize: 13, color: cor.urgente }}>Entregas em atraso</strong>
          <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
            {entregasRestantes.map((e) => (
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
        );
      })()}

      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: cor.texto, margin: 0, display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: cor.atencao }} />
            Contratos parados
          </h2>
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
        {parados.length === 0 ? (
          <p style={{ color: cor.textoTerciario, fontSize: 13, margin: 0 }}>Nenhum contrato parado além do limite.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
            {parados.map((p, i) => (
              <Link key={p.id} href={`/processos/${p.id}`} style={{ textDecoration: "none" }}>
                <CardBento indice={i} clicavel pequeno vidroClaro corAcento={cor.atencao}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <strong style={{ fontSize: 14, color: cor.texto }}>{p.numeroContrato}</strong>
                    <span style={{ fontSize: 12, color: cor.textoTerciario }}>{p.etapaAtual}</span>
                    <span style={{ fontSize: 12, color: cor.urgente, fontWeight: 600 }}>há {p.diasParado} dias</span>
                  </div>
                </CardBento>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
