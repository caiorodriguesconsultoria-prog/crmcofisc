"use client";

import Link from "next/link";
import { cor } from "@/lib/theme";
import IndicadorUrgencia, { type NivelUrgencia } from "./indicador-urgencia";
import TagRotulo from "./tag-rotulo";

function iniciais(nome: string | null | undefined): string {
  if (!nome) return "—";
  return nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join("");
}

function diasAteOPrazo(prazoData: string, hoje: string): number {
  return Math.round(
    (new Date(`${prazoData}T00:00:00`).getTime() - new Date(`${hoje}T00:00:00`).getTime()) / (1000 * 60 * 60 * 24),
  );
}

function nivelUrgenciaPorDias(dias: number): NivelUrgencia {
  if (dias <= 2) return "critico";
  if (dias <= 5) return "atencao";
  return "ok";
}

export type DadosItemProcesso = {
  id: string;
  numeroContrato: string;
  nup: string;
  objeto: string;
  coordenacaoSigla: string | null;
  responsavelNome: string | null;
  prazoData: string | null;
  emCobertura: boolean;
};

// Card de contrato reutilizado no Kanban e na visão Por prazo (ver
// design-system/REGRAS.md — "Item de processo"). Contratos de cobertura (o
// responsável atual não é o titular de sempre) levam borda tracejada, pra
// saltar aos olhos sem precisar de outra cor.
export default function ItemProcesso({
  p,
  arrastavel,
  aoComecarArraste,
  aoTerminarArraste,
}: {
  p: DadosItemProcesso;
  arrastavel?: boolean;
  aoComecarArraste?: () => void;
  aoTerminarArraste?: () => void;
}) {
  const hoje = new Date().toISOString().slice(0, 10);
  const dias = p.prazoData ? diasAteOPrazo(p.prazoData, hoje) : null;

  return (
    <Link
      href={`/processos/${p.id}`}
      draggable={arrastavel}
      onDragStart={aoComecarArraste}
      onDragEnd={aoTerminarArraste}
      style={{
        display: "block",
        textDecoration: "none",
        color: cor.texto,
        background: cor.branco,
        border: p.emCobertura ? `1.5px dashed ${cor.atencao}` : `1px solid ${cor.borda}`,
        borderRadius: 14,
        padding: "12px 14px",
        cursor: arrastavel ? "grab" : "pointer",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 13.5 }}>{p.numeroContrato}</div>
          <div style={{ fontSize: 11.5, color: cor.textoTerciario, marginTop: 2 }}>{p.nup}</div>
          <div
            style={{
              fontSize: 12.5,
              marginTop: 6,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {p.objeto}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
            {p.coordenacaoSigla && <TagRotulo texto={p.coordenacaoSigla} />}
            <span
              aria-label={p.responsavelNome ?? "Sem responsável"}
              style={{
                width: 20,
                height: 20,
                borderRadius: "50%",
                background: cor.destaqueFundo,
                color: cor.destaque,
                fontSize: 9.5,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flex: "none",
              }}
            >
              {iniciais(p.responsavelNome)}
            </span>
          </div>
        </div>
        {p.prazoData && dias !== null && (
          <div style={{ textAlign: "right", flex: "none" }}>
            <IndicadorUrgencia
              nivel={nivelUrgenciaPorDias(dias)}
              texto={dias < 0 ? `${-dias}d atraso` : dias === 0 ? "hoje" : `${dias}d`}
            />
          </div>
        )}
      </div>
    </Link>
  );
}
