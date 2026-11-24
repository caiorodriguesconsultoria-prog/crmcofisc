"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cor, raio } from "@/lib/theme";

// Controle segmentado (CRM Premium, Etapa 1 — "SegmentedControl" da seção
// 3.3, com o indicador deslizante da linha "Abas internas" da tabela de
// motion da seção 12). Reutilizável pra qualquer alternância de 2+ opções
// — primeiro uso real será Resumo/Andamentos/Relatório no contrato aberto
// (Etapa 5), mas já serve hoje pra qualquer seletor do tipo "7/15/30 dias".
// O indicador usa layoutId do framer-motion: anima deslizando entre as
// opções em vez de aparecer/desaparecer em cada uma.
export default function ControleSegmentado<T extends string>({
  opcoes,
  valor,
  aoMudar,
  tamanho = "normal",
}: {
  opcoes: { valor: T; rotulo: string }[];
  valor: T;
  aoMudar: (v: T) => void;
  tamanho?: "normal" | "compacto";
}) {
  const reduzido = useReducedMotion();
  const idGrupo = `controle-segmentado-${opcoes.map((o) => o.valor).join("-")}`;

  return (
    <div
      role="tablist"
      style={{
        display: "inline-flex",
        gap: 2,
        padding: 3,
        borderRadius: raio.pilula,
        background: "rgba(96,93,93,.08)",
        border: `1px solid ${cor.borda}`,
      }}
    >
      {opcoes.map((o) => {
        const ativo = o.valor === valor;
        return (
          <button
            key={o.valor}
            role="tab"
            aria-selected={ativo}
            type="button"
            onClick={() => !ativo && aoMudar(o.valor)}
            style={{
              position: "relative",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              padding: tamanho === "compacto" ? "5px 12px" : "7px 16px",
              fontSize: tamanho === "compacto" ? 12 : 13,
              fontWeight: 600,
              color: ativo ? "#fff" : cor.textoSecundario,
              borderRadius: raio.pilula,
            }}
          >
            {ativo && (
              <motion.span
                layoutId={idGrupo}
                transition={reduzido ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 35 }}
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: raio.pilula,
                  background: cor.destaque,
                  zIndex: 0,
                }}
              />
            )}
            {/* Texto num span próprio, position:relative — garante que
               pinta por cima do indicador deslizante (absolute), já que
               elemento posicionado sem isso pintaria acima de texto estático
               independente da ordem no DOM. */}
            <span style={{ position: "relative", zIndex: 1 }}>{o.rotulo}</span>
          </button>
        );
      })}
    </div>
  );
}
