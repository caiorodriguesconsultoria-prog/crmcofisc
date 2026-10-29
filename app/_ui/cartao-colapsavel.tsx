"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { card, cor, movimento } from "@/lib/theme";

// "Janela flutuante" do redesenho (Etapa 4) — o título expande o conteúdo a
// partir dele mesmo, em 250ms (altura + opacidade, nunca `transition: all`).
// Mesmo componente usado em todas as seções expansíveis do processo e do
// relatório — ver design-system/REGRAS.md.
export default function CartaoColapsavel({
  titulo,
  abertoInicial = true,
  children,
}: {
  titulo: string;
  abertoInicial?: boolean;
  children: React.ReactNode;
}) {
  const [aberto, setAberto] = useState(abertoInicial);
  const reduzido = useReducedMotion();

  return (
    <div style={card}>
      <div
        onClick={() => setAberto((a) => !a)}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
      >
        <strong style={{ fontSize: 12.5, display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: cor.destaque, flex: "none" }} />
          {titulo}
        </strong>
        <span style={{ color: cor.textoTerciario, fontSize: 11 }}>{aberto ? "▾" : "▸"}</span>
      </div>
      <AnimatePresence initial={false}>
        {aberto && (
          <motion.div
            initial={reduzido ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduzido ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: movimento.janela, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ marginTop: 10 }}>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
