import { cor } from "@/lib/theme";

// Anel/medidor pra "quantos de um total têm X" — cada evento é independente
// (um processo pode ter vários eventos ao mesmo tempo, então isso NUNca vira
// fatia de uma pizza só; cada evento é o seu próprio total isolado). Usa a
// mesma cor do evento (preenchido) e uma versão clara dela (trilha), como
// um medidor — não duas cores arbitrárias como numa pizza de 2 fatias.
export default function MedidorCircular({
  valor,
  total,
  corPreenchido,
  corTrilha,
  rotulo,
  tamanho = 72,
}: {
  valor: number;
  total: number;
  corPreenchido: string;
  corTrilha: string;
  rotulo: string;
  tamanho?: number;
}) {
  const raio = tamanho / 2 - 5;
  const circunferencia = 2 * Math.PI * raio;
  const fracao = total > 0 ? valor / total : 0;
  const offset = circunferencia * (1 - fracao);
  const centro = tamanho / 2;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, width: tamanho + 16 }}>
      <svg width={tamanho} height={tamanho} viewBox={`0 0 ${tamanho} ${tamanho}`}>
        <circle cx={centro} cy={centro} r={raio} fill="none" stroke={corTrilha} strokeWidth={7} />
        <circle
          cx={centro}
          cy={centro}
          r={raio}
          fill="none"
          stroke={corPreenchido}
          strokeWidth={7}
          strokeLinecap="round"
          strokeDasharray={circunferencia}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${centro} ${centro})`}
        >
          <title>{`${rotulo}: ${valor} de ${total} (${(fracao * 100).toFixed(0)}%)`}</title>
        </circle>
        <text x={centro} y={centro + 4} textAnchor="middle" fontSize={13} fontWeight={700} fill={cor.texto}>
          {(fracao * 100).toFixed(0)}%
        </text>
      </svg>
      <span style={{ fontSize: 10.5, color: cor.textoSecundario, textAlign: "center", lineHeight: 1.25 }}>
        {rotulo}
      </span>
      <span style={{ fontSize: 10, color: cor.textoTerciario }}>
        {valor} de {total}
      </span>
    </div>
  );
}
