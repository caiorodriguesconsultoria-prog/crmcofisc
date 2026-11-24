// Motor óptico próprio (skill premium-liquid-ui pedia assets/engine/
// liquid-glass.js, mas só o SKILL.md foi enviado — os arquivos de verdade
// não vieram junto, conferido em /root/.claude/uploads). Implementação
// equivalente, sem dependência: refração de verdade via SVG
// feDisplacementMap (o vidro "dobra" os pixels de trás via
// backdrop-filter: url(#...)), não só feGaussianBlur. Testado só em
// Chromium headless (Playwright) neste ambiente — sem evidência de
// WebKit/Firefox, não declarar suporte lá.
//
// Montado UMA vez por página (não por componente) — evita empilhar vários
// filtros/refrações na mesma tela, mesmo espírito do `maxRefracted` da
// skill original.
export default function FiltroRefracaoSVG() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
      <filter id="vidro-refracao" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
        {/* Ruído de baixa frequência = curva suave (lente), não estática —
           frequência mais alta leria como vidro fosco texturizado, errado
           pro efeito de "dobrar a luz" pedido. */}
        <feTurbulence type="fractalNoise" baseFrequency="0.009 0.013" numOctaves={2} seed={7} result="ruido" />
        <feGaussianBlur in="ruido" stdDeviation={6} result="ruidoSuave" />
        <feDisplacementMap in="SourceGraphic" in2="ruidoSuave" scale={16} xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>
  );
}

/** backdrop-filter com refração real (materiais "clear"/"regular" da skill:
 * dock, sidebar, janela) — reserva pra superfícies ESTRUTURAIS, nunca pra
 * tabela/texto longo (ver GlassTable, que continua sem isso de propósito). */
export function backdropRefracao(blurPx: number, saturatePct: number) {
  return `url(#vidro-refracao) blur(${blurPx}px) saturate(${saturatePct}%)`;
}
