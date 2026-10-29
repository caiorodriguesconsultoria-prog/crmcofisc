"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useReducedMotion } from "framer-motion";
import { cor, movimento } from "@/lib/theme";

// KPI do dashboard — rótulo pequeno, número de 40px, variação em texto
// colorido (nunca pílula preenchida). O número conta até o valor final só
// na primeira vez que aparece na tela — ver design-system/REGRAS.md.
export default function Kpi({
  rotulo,
  valor,
  sufixo,
  variacao,
  corNumero,
}: {
  rotulo: string;
  /** Número puro — a formatação pt-BR (milhar) é feita aqui dentro. */
  valor: number;
  sufixo?: string;
  /** Texto da variação (ex. "+3 esta semana") e se é positiva/negativa/neutra. */
  variacao?: { texto: string; sentido: "positivo" | "negativo" | "neutro" };
  /** Cor do número — opcional, pra diferenciar KPIs lado a lado (pedido do
   * Caio: "mais cores, algo mais vivo"). Sem isso, fica no neutro de sempre. */
  corNumero?: string;
}) {
  const reduzido = useReducedMotion();
  const [exibido, setExibido] = useState(reduzido ? valor : 0);
  const jaAnimouRef = useRef(false);

  useEffect(() => {
    if (reduzido || jaAnimouRef.current) {
      setExibido(valor);
      return;
    }
    jaAnimouRef.current = true;
    const controle = animate(0, valor, {
      duration: movimento.contagemKpi,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setExibido(Math.round(v)),
    });
    return () => controle.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- conta só na 1ª aparição, não a cada mudança de valor
  }, []);

  // Versões escuras (positivoTexto/urgenteTexto) — texto pequeno de 12,5px
  // precisa de 4,5:1 de contraste; cor.positivo/cor.urgente "cheias" só têm
  // 3 a 4,3:1 (ver nota em lib/theme.ts, Etapa 6 do redesenho).
  const corVariacao =
    variacao?.sentido === "positivo"
      ? cor.positivoTexto
      : variacao?.sentido === "negativo"
        ? cor.urgenteTexto
        : cor.textoTerciario;

  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, color: cor.textoTerciario }}>
        {rotulo}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 4 }}>
        <span style={{ fontSize: 40, fontWeight: 600, color: corNumero ?? cor.texto, lineHeight: 1 }}>
          {exibido.toLocaleString("pt-BR")}
          {sufixo}
        </span>
        {variacao && (
          <span style={{ fontSize: 12.5, fontWeight: 600, color: corVariacao }}>{variacao.texto}</span>
        )}
      </div>
    </div>
  );
}
