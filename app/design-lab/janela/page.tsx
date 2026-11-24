"use client";

import { useState } from "react";
import AmbientBackground from "../_glass/ambient-background";
import FiltroRefracaoSVG from "../_glass/refracao";
import { GlassWindow, GlassTabs, GlassTable, GlassButton } from "../_glass/componentes";
import { cor, corEscuro } from "@/lib/theme";

// /design-lab/janela — prova da janela contratual (CRM_LIQUID_GLASS_SKILLS.md,
// seção 5.5: "janela contratual com texto denso e tabelas"). Dados
// fictícios, não é tela do produto.
export default function DesignLabJanelaPage() {
  const [escuro, setEscuro] = useState(false);
  const [aba, setAba] = useState<"resumo" | "andamentos" | "relatorio">("resumo");
  const paleta = escuro ? corEscuro : cor;

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <FiltroRefracaoSVG />
      <AmbientBackground escuro={escuro} />

      <GlassWindow escuro={escuro} style={{ width: "100%", maxWidth: 760 }}>
        <div style={{ padding: "20px 24px 16px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", background: paleta.destaque, display: "inline-block", padding: "4px 10px", borderRadius: 999 }}>
              234/2026
            </div>
            <h2 style={{ margin: "8px 0 0", fontSize: 18, color: paleta.texto }}>Aquisição de insumos hospitalares</h2>
            <p style={{ margin: "2px 0 0", fontSize: 12.5, color: paleta.textoTerciario }}>CGECA · NUP 25000.208214/2025-10</p>
          </div>
          <GlassButton escuro={escuro} onClick={() => setEscuro((v) => !v)}>
            {escuro ? "Claro" : "Escuro"}
          </GlassButton>
        </div>

        <div style={{ padding: "0 24px 16px" }}>
          <GlassTabs
            escuro={escuro}
            opcoes={[
              { valor: "resumo" as const, rotulo: "Resumo" },
              { valor: "andamentos" as const, rotulo: "Andamentos" },
              { valor: "relatorio" as const, rotulo: "Relatório" },
            ]}
            valor={aba}
            aoMudar={setAba}
          />
        </div>

        <div style={{ padding: "0 24px 28px", display: "flex", flexDirection: "column", gap: 14, maxHeight: 420, overflowY: "auto" }}>
          <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color: paleta.texto }}>
            Objeto: aquisição de insulina humana, desmopressina acetato e demais insumos para atendimento das unidades
            vinculadas à coordenação. Vigência até 04/12/2026. Fiscal titular designado por portaria publicada no DOU,
            com substituto indicado para os períodos de ausência regulamentar.
          </p>
          <GlassTable
            escuro={escuro}
            colunas={["Parcela", "Prazo", "Situação"]}
            linhas={[
              ["1ª parcela", "04/12/2026", <span key="a" style={{ color: cor.verdeEscuro, fontWeight: 600 }}>Entregue</span>],
              ["2ª parcela", "11/12/2026", <span key="b" style={{ color: cor.atencao, fontWeight: 600 }}>Aguardando</span>],
              ["3ª parcela", "a definir", "—"],
            ]}
          />
        </div>
      </GlassWindow>
    </div>
  );
}
