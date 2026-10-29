"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cor, raio, movimento } from "@/lib/theme";
import { usarPodeHover } from "./usar-pode-hover";

// Card base da grade bento — cabeçalho igual em todo lugar (título +
// subtítulo cinza + botão redondo opcional no canto), reaproveitado em
// todos os cards do Painel. Ver design-system/REGRAS.md.
export default function CardBento({
  titulo,
  subtitulo,
  acao,
  clicavel,
  pequeno,
  carregando,
  indice = 0,
  children,
  style,
}: {
  titulo?: string;
  subtitulo?: string;
  acao?: React.ReactNode;
  clicavel?: boolean;
  pequeno?: boolean;
  carregando?: boolean;
  /** Posição do card na grade — usado só pra escalonar a entrada (índice × 40ms). */
  indice?: number;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}) {
  const reduzido = useReducedMotion();
  const podeHover = usarPodeHover();

  return (
    <motion.div
      initial={reduzido ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: movimento.entrada,
        delay: reduzido ? 0 : indice * movimento.escalonado,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={
        clicavel && !reduzido && podeHover
          ? { y: -6, boxShadow: "0 14px 32px rgba(32,31,29,.16)", transition: { duration: movimento.hover } }
          : undefined
      }
      style={{
        background: cor.branco,
        borderRadius: pequeno ? raio.cardPequeno : raio.card,
        border: `1px solid ${cor.borda}`,
        padding: 24,
        cursor: clicavel ? "pointer" : undefined,
        boxShadow: "0 0px 0px rgba(32,31,29,0)",
        ...style,
      }}
    >
      {(titulo || acao) && (
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: carregando ? 0 : 14 }}>
          <div style={{ minWidth: 0 }}>
            {titulo && <div style={{ fontSize: 16, fontWeight: 600, color: cor.texto }}>{titulo}</div>}
            {subtitulo && <div style={{ fontSize: 12, color: cor.textoTerciario, marginTop: 2 }}>{subtitulo}</div>}
          </div>
          {acao && <div style={{ flex: "none" }}>{acao}</div>}
        </div>
      )}
      {carregando ? <Esqueleto /> : children}
    </motion.div>
  );
}

function Esqueleto() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
      <div style={{ height: 12, borderRadius: 6, background: "rgba(32,31,29,.06)", width: "70%" }} />
      <div style={{ height: 12, borderRadius: 6, background: "rgba(32,31,29,.06)", width: "90%" }} />
      <div style={{ height: 12, borderRadius: 6, background: "rgba(32,31,29,.06)", width: "50%" }} />
    </div>
  );
}
