"use client";

// AmbientBackground (CRM_LIQUID_GLASS_SKILLS.md, seção 11 — "requisito
// visual obrigatório"): composição azul luminosa com curvas largas e
// suaves, camadas diagonais onduladas, SVG estático (sem imagem remota,
// sem animação contínua). Paleta exatamente a sugerida no documento:
// #78A9E8, #A6CFFF, #D5E9FF, #F0F7FF, #568CD5 — versão escura em azul
// profundo equivalente. Compartilhado entre as telas do /design-lab
// (futuramente DesktopShell/MobileShell, só depois de aprovado).
export default function AmbientBackground({ escuro }: { escuro?: boolean }) {
  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: -1,
        overflow: "hidden",
        background: escuro ? "#050B1A" : "#F0F7FF",
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 1600 1000"
        preserveAspectRatio="xMidYMid slice"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      >
        <defs>
          <filter id="ondaBlur" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="70" />
          </filter>
          <linearGradient id="ondaBase" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={escuro ? "#0A1530" : "#F0F7FF"} />
            <stop offset="100%" stopColor={escuro ? "#050B1A" : "#D5E9FF"} />
          </linearGradient>
        </defs>

        <rect width="1600" height="1000" fill="url(#ondaBase)" />

        {/* Camadas diagonais onduladas — curvas bezier largas, cada uma uma
           "faixa" de cor, sobrepostas com blur forte e opacidade baixa, pra
           ler como luz suave em movimento, não como forma geométrica dura. */}
        <g filter="url(#ondaBlur)" opacity={escuro ? 0.5 : 0.75}>
          <path d="M-200,150 C250,50 550,320 950,220 C1250,150 1450,0 1800,80 L1800,-200 L-200,-200 Z" fill={escuro ? "#1B3FA6" : "#78A9E8"} />
          <path d="M-200,420 C300,300 600,560 1000,460 C1350,380 1500,250 1800,340 L1800,120 C1450,40 1250,190 950,260 C550,360 250,90 -200,190 Z" fill={escuro ? "#2F5FDB" : "#A6CFFF"} />
          <path d="M-200,680 C350,560 650,820 1050,700 C1400,600 1550,480 1800,560 L1800,360 C1500,270 1350,400 1000,480 C600,580 300,320 -200,440 Z" fill={escuro ? "#14245A" : "#D5E9FF"} />
          <path d="M-200,950 C400,820 700,1050 1100,920 C1450,810 1600,700 1800,780 L1800,600 C1550,500 1400,620 1050,720 C650,840 350,580 -200,700 Z" fill={escuro ? "#071029" : "#568CD5"} />
        </g>

        {/* Ponto de luz suave (canto superior, "reflexo" que dá profundidade
           sem ser um brilho forte/neon) */}
        <circle cx="1250" cy="120" r="420" fill={escuro ? "#3A6FE0" : "#FFFFFF"} opacity={escuro ? 0.12 : 0.35} filter="url(#ondaBlur)" />
      </svg>
    </div>
  );
}
