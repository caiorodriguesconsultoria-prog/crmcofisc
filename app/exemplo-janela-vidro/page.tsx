"use client";

import PainelAltoModal from "@/app/_ui/painel-alto-modal";
import { cor } from "@/lib/theme";

// Tela temporária da Etapa 5 — prova visual do vidro NOVO calibrado pra
// janela do contrato aberto (.crm-painel-alto/.crm-modal-painel, ≥681px),
// sobre um fundo aurora (pra dar o que borrar) e com texto denso dentro
// (pra conferir legibilidade). Não é uma tela do produto.
export default function ExemploJanelaVidroPage() {
  return (
    <div className="crm-fundo-aurora" style={{ minHeight: "100vh" }}>
      <PainelAltoModal
        maxWidth={700}
        topo={
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: cor.destaque, background: cor.destaqueFundo, display: "inline-block", padding: "4px 10px", borderRadius: 999 }}>
              234/2026
            </div>
            <h2 style={{ margin: "8px 0 0", fontSize: 18 }}>Exemplo — Janela do contrato (Etapa 5)</h2>
            <p style={{ margin: "2px 0 0", fontSize: 12.5, color: cor.textoTerciario }}>
              Prova do vidro na janela — tela temporária, não faz parte do produto
            </p>
          </div>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color: cor.texto }}>
            Texto denso de teste, igual ao corpo de verdade do contrato: objeto do contrato, cláusulas,
            observações de andamento. Se a legibilidade cair, este parágrafo fica difícil de ler contra o
            fundo — é exatamente o problema que apareceu da primeira vez que vidro foi tentado aqui.
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
      </PainelAltoModal>
    </div>
  );
}
