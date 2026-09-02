"use client";

import { useState } from "react";
import Link from "next/link";
import { card, cor, PALETA_EVENTOS } from "@/lib/theme";
import { corEvento } from "@/lib/cores-evento";
import MedidorCircular from "@/app/_ui/medidor-circular";
import { BotaoCopiar } from "@/app/_ui/campo";

type Processo = {
  id: string;
  numeroContrato: string;
  etapaAtual: string;
  diasParado: number | null;
};

type ItemAtividade = { rotulo: string; horario: string | null };

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

const grade: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(88px, 1fr))",
  gap: 14,
  marginTop: 10,
};

export default function PainelDashboard({
  processos,
  contagemPorEtapa,
  contagemPorEvento,
  ativos,
  concluidos,
  vencendoHoje,
  emCoberturaFerias,
  processosAtividadeHoje,
  eventos,
  etapas,
}: {
  processos: Processo[];
  contagemPorEtapa: Record<string, number>;
  contagemPorEvento: Record<string, number>;
  ativos: number;
  concluidos: number;
  vencendoHoje: number;
  emCoberturaFerias: number;
  processosAtividadeHoje: ProcessoAtividadeHoje[];
  eventos: Evento[];
  etapas: Etapa[];
}) {
  const [limiteDias, setLimiteDias] = useState(15);

  const parados = processos
    .filter((p) => p.diasParado !== null && p.diasParado >= limiteDias)
    .sort((a, b) => (b.diasParado ?? 0) - (a.diasParado ?? 0));


  return (
    <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <div style={{ ...card, flex: "1 1 160px" }}>
          <span style={{ fontSize: 10.5, textTransform: "uppercase", color: cor.textoTerciario, letterSpacing: 0.5 }}>
            Total de processos
          </span>
          <p style={{ fontSize: 28, fontWeight: 700, margin: "4px 0 0" }}>{processos.length}</p>
        </div>
        <div style={{ ...card, flex: "1 1 160px" }}>
          <span style={{ fontSize: 10.5, textTransform: "uppercase", color: cor.textoTerciario, letterSpacing: 0.5 }}>
            Ativos
          </span>
          <p style={{ fontSize: 28, fontWeight: 700, margin: "4px 0 0" }}>{ativos}</p>
        </div>
        {/* <a> normal de propósito — /processos/concluidos tem o mesmo formato de
        URL que a rota interceptada do modal /processos/[id], e navegação
        client-side (<Link>) acaba caindo no modal tratando "concluidos" como
        id. Um <a> força navegação completa, que resolve certo pelo servidor. */}
        <a
          href="/processos/concluidos"
          style={{ ...card, flex: "1 1 160px", textDecoration: "none", color: "inherit", display: "block" }}
        >
          <span style={{ fontSize: 10.5, textTransform: "uppercase", color: cor.textoTerciario, letterSpacing: 0.5 }}>
            Concluídos
          </span>
          <p style={{ fontSize: 28, fontWeight: 700, margin: "4px 0 0", color: cor.positivo }}>{concluidos}</p>
        </a>
        <div style={{ ...card, flex: "1 1 160px" }}>
          <span style={{ fontSize: 10.5, textTransform: "uppercase", color: cor.textoTerciario, letterSpacing: 0.5 }}>
            Vencendo hoje
          </span>
          <p style={{ fontSize: 28, fontWeight: 700, margin: "4px 0 0", color: vencendoHoje > 0 ? cor.urgente : cor.texto }}>
            {vencendoHoje}
          </p>
        </div>
      </div>

      <div style={card}>
        <strong style={{ fontSize: 13 }}>Atividade de hoje</strong>
        <p style={{ fontSize: 12, color: cor.textoTerciario, margin: "2px 0 10px" }}>
          Processos com tarefa ou agendamento marcado pra hoje.
        </p>
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
                          background: cor.destaqueFundo,
                          color: cor.destaque,
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
                            {item.horario ? `${item.horario.slice(0, 5)} · ` : ""}
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
      </div>

      <div style={card}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <strong style={{ fontSize: 13 }}>Processos parados</strong>
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
              Nenhum processo parado além do limite.
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
                background: cor.fundo,
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
        <strong style={{ fontSize: 13 }}>Processos por etapa e evento</strong>
        <p style={{ fontSize: 12, color: cor.textoTerciario, margin: "2px 0 12px" }}>
          Cada etapa e cada evento é um medidor à parte, com seu próprio total — um
          processo está em uma única etapa, mas pode ter vários eventos ao mesmo tempo.
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
