"use client";

import { motion, useReducedMotion } from "framer-motion";

// Fundo da tela de login — referência visual aprovada pelo Caio (mockup
// anexado): "fundo azul perolado" com esferas 3D flutuando, composição
// assimétrica. CSS/SVG puro (gradientes + box-shadow), sem WebGL/shader —
// decisão deliberada: o teste de desempenho do @paper-design/shaders-react
// no /design-lab (mesma sessão) mediu custo alto ao combinar canvas WebGL
// com qualquer animação contínua por cima; aqui a tela TEM animação
// contínua (flutuação das esferas), então CSS puro (GPU/WAAPI, sem o
// problema de recomposição do canvas) é a escolha certa, não só a mais
// simples. Ver app/design-lab/CONHECIMENTO.md pra os números.
const ESFERAS = [
  // posição (top-left %), tamanho, gradiente (destaque -> meio -> sombra), flutua
  { top: "6%", left: "9%", tamanho: 96, de: "#AFCBFA", meio: "#6FA0ED", ate: "#3A6FDB", flutuar: 14 },
  { top: "-8%", left: "74%", tamanho: 280, de: "#8FB4F2", meio: "#4C7FDE", ate: "#2653B8", flutuar: 22 },
  { top: "58%", left: "66%", tamanho: 340, de: "#9CC0F5", meio: "#5585E2", ate: "#2F5FDB", flutuar: 18 },
];

function Esfera({ top, left, tamanho, de, meio, ate, flutuar, reduzido }: (typeof ESFERAS)[number] & { reduzido: boolean }) {
  return (
    <motion.div
      aria-hidden
      animate={reduzido ? undefined : { y: [0, -flutuar, 0] }}
      transition={reduzido ? undefined : { duration: 7 + flutuar / 4, repeat: Infinity, ease: "easeInOut" }}
      style={{
        position: "absolute",
        top,
        left,
        width: tamanho,
        height: tamanho,
        borderRadius: "50%",
        background: `radial-gradient(circle at 32% 26%, ${de} 0%, ${meio} 45%, ${ate} 100%)`,
        boxShadow: `0 ${tamanho * 0.12}px ${tamanho * 0.3}px -${tamanho * 0.1}px rgba(26,54,138,.35)`,
      }}
    />
  );
}

export default function FundoLogin() {
  const reduzido = !!useReducedMotion();
  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: -1,
        overflow: "hidden",
        background: "linear-gradient(135deg, #EEF1FC 0%, #E4EAFB 45%, #F1F3FD 100%)",
      }}
    >
      {ESFERAS.map((e, i) => (
        <Esfera key={i} {...e} reduzido={reduzido} />
      ))}
    </div>
  );
}
