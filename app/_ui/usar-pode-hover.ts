"use client";

import { useEffect, useState } from "react";

// true só em dispositivo com hover de verdade e ponteiro fino (mouse) —
// evita o "hover preso" depois de um toque em celular/tablet. Usado pelos
// componentes com whileHover do framer-motion (CardBento, Kpi clicável
// etc.). Ver design-system/REGRAS.md e a skill mobile-native.
export function usarPodeHover(): boolean {
  const [podeHover, setPodeHover] = useState(false);

  useEffect(() => {
    const consulta = window.matchMedia("(hover: hover) and (pointer: fine)");
    setPodeHover(consulta.matches);
    const ouvir = (e: MediaQueryListEvent) => setPodeHover(e.matches);
    consulta.addEventListener("change", ouvir);
    return () => consulta.removeEventListener("change", ouvir);
  }, []);

  return podeHover;
}
