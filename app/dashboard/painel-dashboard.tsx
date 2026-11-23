"use client";

import { useState } from "react";
import Link from "next/link";
import { Reorder } from "framer-motion";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { createClient } from "@/lib/supabase/client";
import { cor, PALETA_VIVA } from "@/lib/theme";
import { corEvento } from "@/lib/cores-evento";
import { corEtapa } from "@/lib/cor-etapa";
import MedidorCircular from "@/app/_ui/medidor-circular";
import { BotaoCopiar } from "@/app/_ui/campo";
import CardBento from "@/app/_ui/card-bento";
import Kpi from "@/app/_ui/kpi";
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
  fornecedor: string | null;
  tags: { id: string; valor: string; cor: string | null }[];
  itens: ItemAtividade[];
};

type Evento = { id: string; valor: string; cor: string | null };
type Etapa = { id: string; nome: string };

// IDs fixos dos widgets reorganizáveis do Painel (modo "Editar", pedido do
// Caio) — a ordem escolhida fica salva em `painel_layout` (ver migração
// 0049). ORDEM_PADRAO é a ordem de fábrica, usada quando a pessoa ainda não
// reorganizou nada ou quando um widget novo aparece (entra no fim).
type SecaoId = "kpis" | "agenda" | "coordenacao" | "graficos" | "parados";
const ORDEM_PADRAO: SecaoId[] = ["kpis", "agenda", "coordenacao", "graficos", "parados"];

// Tooltip escuro padrão dos gráficos do Painel — só o nome e o valor, sem
// nenhuma legenda fixa na tela (pedido do Caio: "não precisa colocar os
// nomes nas cores, ao passar o mouse em cima o nome aparece").
function TooltipGrafico({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  // item.name vem do dataKey da barra ("valor") quando a <Bar> não tem um
  // `name` próprio — o nome de verdade (a etapa/evento) está em
  // item.payload.nome. Era esse o bug: tooltip mostrando "valor: 1" em vez
  // do nome da etapa, reportado pelo Caio com print.
  return (
    <div style={{ background: cor.escuro, color: "#fff", borderRadius: 10, padding: "6px 10px", fontSize: 12.5 }}>
      <strong>{item.payload?.nome ?? item.name}</strong>: {item.value}
    </div>
  );
}

export default function PainelDashboard({
  pessoaId,
  ordemSalva,
  processos,
  contagemPorEtapa,
  contagemPorEvento,
  ativos,
  concluidos,
  emCoberturaFerias,
  divisaoPorCoordenacao,
  processosAtividadeHoje,
  eventos,
  etapas,
}: {
  /** ID da pessoa logada — usado só pra salvar a ordem dos widgets na
   * conta. Sem isso (caso raro, cadastro sem linha em `pessoas`), o modo
   * "Editar" não aparece. */
  pessoaId: string | null;
  /** Ordem salva anteriormente (painel_layout.ordem_widgets) — null se a
   * pessoa nunca reorganizou. */
  ordemSalva: string[] | null;
  processos: Processo[];
  contagemPorEtapa: Record<string, number>;
  contagemPorEvento: Record<string, number>;
  ativos: number;
  concluidos: number;
  emCoberturaFerias: number;
  divisaoPorCoordenacao: { sigla: string; total: number }[];
  processosAtividadeHoje: ProcessoAtividadeHoje[];
  eventos: Evento[];
  etapas: Etapa[];
}) {
  const supabase = createClient();
  const [limiteDias, setLimiteDias] = useState(15);
  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);

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
  // Pedido do Caio: tirar "Vencem em 7 dias", "Com ocorrência" e "Vencendo
  // hoje" — ficam só os dois KPIs abaixo.
  const kpis = [
    { rotulo: "Contratos ativos", valor: ativos, corNumero: cor.azulEscuro },
    { rotulo: "Concluídos", valor: concluidos, corNumero: cor.verdeEscuro, href: "/processos/concluidos" },
  ];

  // Cada widget reorganizável vira um nó só, guardado num mapa por ID —
  // o que muda de uma reorganização pra outra é só a ORDEM desses nós, o
  // conteúdo de cada um continua igual ao de antes.
  const secoes: Partial<Record<SecaoId, React.ReactNode>> = {
    kpis: (
      // justifyContent centralizado só no celular (classe CSS, media query
      // em globals.css) — no desktop fica alinhado à esquerda como antes.
      <div className="crm-grid-kpis-painel" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 210px))", gap: 12 }}>
        {kpis.map((k, i) => {
          const conteudo = (
            <CardBento key={k.rotulo} indice={i} pequeno clicavel={!!k.href} corAcento={PALETA_VIVA[i % PALETA_VIVA.length]} vidroClaro>
              <Kpi rotulo={k.rotulo} valor={k.valor} corNumero={k.corNumero} />
            </CardBento>
          );
          return k.href ? (
            <Link key={k.rotulo} href={k.href} style={{ textDecoration: "none", display: "block", minWidth: 0 }}>
              {conteudo}
            </Link>
          ) : (
            conteudo
          );
        })}
      </div>
    ),
    agenda: (
      <div>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: cor.texto, margin: "0 0 2px" }}>Agenda de hoje</h2>
        <p style={{ fontSize: 11.5, color: cor.textoTerciario, margin: "0 0 8px" }}>Contratos com tarefa ou agendamento marcado pra hoje</p>
        {processosAtividadeHoje.length === 0 ? (
          <p style={{ color: cor.textoTerciario, fontSize: 13, margin: 0 }}>Nenhuma atividade marcada pra hoje.</p>
        ) : (
          // Centralizado só no celular (pedido do Caio: no meio da tela em
          // vez de colado na esquerda, onde só cabe 1 por linha) — no
          // desktop fica alinhado à esquerda, igual ao resto do Painel
          // (tinha ficado centralizado nos dois por engano).
          <div className="crm-grid-kpis-painel" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 260px))", gap: 12 }}>
            {processosAtividadeHoje.map((p, i) => (
              <CardBento key={p.id} indice={i} pequeno vidroClaro corAcento={PALETA_VIVA[i % PALETA_VIVA.length]}>
                {/* Card resumido — só identidade do contrato (pedido do
                   Caio: "deixar somente uma parte do card"). Etapa, tags e
                   os horários do dia ficam pra quando abre o contrato. */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
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
                  {p.fornecedor && (
                    <p style={{ fontSize: 12, color: cor.textoSecundario, margin: 0 }}>{p.fornecedor}</p>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: cor.textoSecundario }}>
                    <span style={{ fontVariantNumeric: "tabular-nums" }}>{p.nup}</span>
                    <BotaoCopiar texto={p.nup} />
                  </div>
                </div>
              </CardBento>
            ))}
          </div>
        )}
      </div>
    ),
    coordenacao: (
      <div>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: cor.texto, margin: "0 0 2px" }}>Divisão por coordenação</h2>
        <p style={{ fontSize: 11.5, color: cor.textoTerciario, margin: "0 0 8px" }}>Contratos ativos</p>
        {divisaoPorCoordenacao.length === 0 ? (
          <p style={{ color: cor.textoTerciario, fontSize: 13, margin: 0 }}>Nenhum contrato ativo.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 170px))", gap: 12, justifyContent: "start" }}>
            {divisaoPorCoordenacao.map((c, i) => (
              <CardBento key={c.sigla} indice={i} pequeno vidroClaro corAcento={PALETA_VIVA[i % PALETA_VIVA.length]}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <TagRotulo texto={c.sigla} corTexto={PALETA_VIVA[i % PALETA_VIVA.length]} />
                  <strong style={{ fontSize: 22, fontWeight: 700, color: cor.texto, fontVariantNumeric: "tabular-nums" }}>{c.total}</strong>
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
    ),
    graficos: (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 340px))", gap: 12, justifyContent: "start" }}>
        <CardBento titulo="Contratos por etapa" indice={0} pequeno corAcento={PALETA_VIVA[0]} vidroClaro>
          {dadosEtapas.length === 0 ? (
            <p style={{ color: cor.textoTerciario, fontSize: 13, margin: 0 }}>Nenhum contrato ativo.</p>
          ) : (
            <div style={{ width: "100%", height: 150 }}>
              <ResponsiveContainer>
                <BarChart data={dadosEtapas} barCategoryGap="15%">
                  <Tooltip content={<TooltipGrafico />} cursor={{ fill: "rgba(32,31,29,.05)" }} />
                  <Bar dataKey="valor" radius={[8, 8, 0, 0]} maxBarSize={34}>
                    {dadosEtapas.map((_, i) => (
                      <Cell key={i} fill={PALETA_VIVA[i % PALETA_VIVA.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardBento>

        <CardBento titulo="Eventos" subtitulo="Quantos contratos ativos têm cada evento agora" indice={1} pequeno corAcento={PALETA_VIVA[1]} vidroClaro>
          {dadosEventos.length === 0 ? (
            <p style={{ color: cor.textoTerciario, fontSize: 13, margin: 0 }}>Nenhum evento ativo no momento.</p>
          ) : (
            <div style={{ width: "100%", height: 150 }}>
              <ResponsiveContainer>
                <BarChart data={dadosEventos} barCategoryGap="15%">
                  <Tooltip content={<TooltipGrafico />} cursor={{ fill: "rgba(32,31,29,.05)" }} />
                  <Bar dataKey="valor" radius={[8, 8, 0, 0]} maxBarSize={24}>
                    {dadosEventos.map((d, i) => (
                      <Cell key={i} fill={d.cor} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          <div style={{ marginTop: 6, display: "flex", justifyContent: "center" }}>
            <MedidorCircular
              valor={emCoberturaFerias}
              total={processos.length}
              corPreenchido={cor.atencao}
              corTrilha={cor.atencaoFundo}
              rotulo="Cobertura de férias"
              tamanho={60}
            />
          </div>
        </CardBento>
      </div>
    ),
    parados: (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: cor.texto, margin: 0, display: "flex", alignItems: "center", gap: 7 }}>
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
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 220px))", gap: 12, justifyContent: "start" }}>
            {parados.map((p, i) => (
              <Link key={p.id} href={`/processos/${p.id}`} style={{ textDecoration: "none", display: "block", minWidth: 0 }}>
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
    ),
  };

  const disponiveis = ORDEM_PADRAO.filter((id) => secoes[id]);

  const [ordem, setOrdem] = useState<SecaoId[]>(() => {
    const salvaFiltrada = (ordemSalva ?? []).filter((id): id is SecaoId => disponiveis.includes(id as SecaoId));
    const faltando = disponiveis.filter((id) => !salvaFiltrada.includes(id));
    return [...salvaFiltrada, ...faltando] as SecaoId[];
  });

  async function salvarOrdem() {
    if (!pessoaId) {
      setEditando(false);
      return;
    }
    setSalvando(true);
    await supabase
      .from("painel_layout")
      .upsert({ pessoa_id: pessoaId, ordem_widgets: ordem, atualizado_em: new Date().toISOString() });
    setSalvando(false);
    setEditando(false);
  }

  return (
    <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 14 }}>
      {pessoaId && (
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={editando ? salvarOrdem : () => setEditando(true)}
            disabled={salvando}
            style={{
              fontSize: 12.5,
              fontWeight: 700,
              padding: "7px 16px",
              borderRadius: 999,
              border: "none",
              color: editando ? "#fff" : cor.destaque,
              background: editando ? cor.destaque : cor.destaqueFundo,
            }}
          >
            {salvando ? "Salvando..." : editando ? "Concluído" : "Editar"}
          </button>
        </div>
      )}

      {editando ? (
        <Reorder.Group as="div" axis="y" values={ordem} onReorder={setOrdem} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {ordem.map((id) => (
            <Reorder.Item key={id} value={id} as="div" className="crm-widget-jiggle" whileDrag={{ scale: 1.02, zIndex: 10, boxShadow: "0 16px 36px rgba(32,31,29,.2)" }}>
              {secoes[id]}
            </Reorder.Item>
          ))}
        </Reorder.Group>
      ) : (
        ordem.map((id) => <div key={id}>{secoes[id]}</div>)
      )}
    </div>
  );
}
