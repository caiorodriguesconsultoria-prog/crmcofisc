import PainelAlto from "@/app/_ui/painel-alto";
import { cor } from "@/lib/theme";

// Mesma prova da Etapa 5, mas com PainelAlto (versão de tela cheia,
// /processos/[id] direto) em vez de PainelAltoModal — sem o scrim escuro
// do modal (.crm-modal-fundo) diluindo o fundo aurora atrás do vidro. Não
// é uma tela do produto.
export default function ExemploJanelaVidroPaginaCheiaPage() {
  return (
    <PainelAlto
      voltarHref="/exemplo-janela-vidro/pagina-cheia"
      maxWidth={700}
      topo={
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: cor.destaque, background: cor.destaqueFundo, display: "inline-block", padding: "4px 10px", borderRadius: 999 }}>
            234/2026
          </div>
          <h2 style={{ margin: "8px 0 0", fontSize: 18 }}>Exemplo — Janela do contrato, tela cheia (Etapa 5)</h2>
          <p style={{ margin: "2px 0 0", fontSize: 12.5, color: cor.textoTerciario }}>
            Prova do vidro sem o scrim escuro do modal — tela temporária, não faz parte do produto
          </p>
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color: cor.texto }}>
          Texto denso de teste, igual ao corpo de verdade do contrato: objeto do contrato, cláusulas,
          observações de andamento. Se a legibilidade cair, este parágrafo fica difícil de ler contra o
          fundo.
        </p>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: `1px solid ${cor.borda}` }}>
              <th style={{ padding: 8 }}>Parcela</th>
              <th style={{ padding: 8 }}>Prazo</th>
              <th style={{ padding: 8 }}>Situação</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3].map((n) => (
              <tr key={n} style={{ borderBottom: `1px solid ${cor.borda}` }}>
                <td style={{ padding: 8 }}>{n}ª parcela</td>
                <td style={{ padding: 8 }}>15/12/2026</td>
                <td style={{ padding: 8, color: cor.verdeEscuro, fontWeight: 600 }}>Entregue</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PainelAlto>
  );
}
