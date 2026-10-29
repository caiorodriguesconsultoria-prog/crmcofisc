import { cor } from "@/lib/theme";

// Medidor semicircular — sempre em percentual (ver design-system/REGRAS.md).
// Diferente do MedidorCircular (anel fechado, usado pra "quantos de um
// total"), esse é um arco de 180°, pensado especificamente pro percentual de
// transcurso de validade na entrega (Etapa 4/6 do redesenho).
export default function MedidorSemicircular({
  percentual,
  rotulo,
  tamanho = 120,
  corPreenchido,
}: {
  /** 0 a 100 */
  percentual: number;
  rotulo: string;
  tamanho?: number;
  corPreenchido?: string;
}) {
  const espessura = Math.max(6, tamanho * 0.09);
  const pad = espessura / 2 + 2;
  const raio = tamanho / 2 - pad;
  const centroX = tamanho / 2;
  const centroY = tamanho / 2;
  const semicircunferencia = Math.PI * raio;
  const fracao = Math.min(100, Math.max(0, percentual)) / 100;
  const offset = semicircunferencia * (1 - fracao);

  // Verde quando sobra bastante validade, âmbar na faixa intermediária,
  // vermelho quando já passou a maior parte do prazo — mesmas cores de
  // urgência usadas no resto do sistema, não uma paleta nova.
  const corArco =
    corPreenchido ?? (percentual >= 70 ? cor.urgente : percentual >= 40 ? cor.atencao : cor.positivo);

  const caminho = `M ${pad} ${centroY} A ${raio} ${raio} 0 0 1 ${tamanho - pad} ${centroY}`;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, width: tamanho }}>
      <svg width={tamanho} height={tamanho / 2 + 8} viewBox={`0 0 ${tamanho} ${tamanho / 2 + 8}`}>
        <path d={caminho} fill="none" stroke={cor.fundo} strokeWidth={espessura} strokeLinecap="round" />
        <path
          d={caminho}
          fill="none"
          stroke={corArco}
          strokeWidth={espessura}
          strokeLinecap="round"
          strokeDasharray={semicircunferencia}
          strokeDashoffset={offset}
        />
        <text x={centroX} y={centroY - 2} textAnchor="middle" fontSize={tamanho * 0.17} fontWeight={700} fill={cor.texto}>
          {percentual.toFixed(0)}%
        </text>
      </svg>
      <span style={{ fontSize: 10.5, color: cor.textoSecundario, textAlign: "center", lineHeight: 1.25 }}>
        {rotulo}
      </span>
    </div>
  );
}
