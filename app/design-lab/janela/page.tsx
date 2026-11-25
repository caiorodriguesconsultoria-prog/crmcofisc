"use client";

import { useState } from "react";
import { FileText, Clock, MessageSquare, CheckCircle2 } from "lucide-react";
import AmbientBackground from "../_glass/ambient-background";
import FiltroRefracaoSVG from "../_glass/refracao";
import { GlassWindow, GlassTabs, GlassTable, GlassButton, GlassIconChip, GlassTimeline } from "../_glass/componentes";
import { cor, corEscuro } from "@/lib/theme";

// /design-lab/janela — prova da janela contratual (CRM_LIQUID_GLASS_SKILLS.md,
// seção 5.5: "janela contratual com texto denso e tabelas"). Dados
// fictícios, não é tela do produto.
//
// Fase 7: as três abas (Resumo/Andamentos/Relatório) passaram a mostrar
// conteúdo de verdade cada uma — antes o seletor trocava de aba mas o
// corpo renderizava sempre o mesmo texto de Resumo, um bug que ninguém
// tinha notado porque a prova só validava legibilidade, não navegação.
// Acrescentado também o "Cronograma de entregas" em timeline (bolinhas +
// linha), que estava na imagem de referência e não tinha sido feito
// ainda — a tabela de parcelas continua existindo, mas só na aba Resumo.
type Aba = "resumo" | "andamentos" | "relatorio";

const ANDAMENTOS = [
  { rotulo: "Relatório de execução inserido", detalhe: "22/11/2026 · Fiscal titular", status: "concluido" as const },
  { rotulo: "2ª parcela aguardando recebimento", detalhe: "18/11/2026 · Fornecedor notificado", status: "atual" as const },
  { rotulo: "1ª parcela entregue e conferida", detalhe: "04/11/2026 · Fiscal titular", status: "concluido" as const },
  { rotulo: "Contrato assinado e publicado", detalhe: "02/10/2026 · DOU", status: "concluido" as const },
];

const CRONOGRAMA = [
  { rotulo: "1ª parcela · 41.000 un.", detalhe: "Entregue em 04/12/2026", status: "concluido" as const },
  { rotulo: "2ª parcela · 18.000 un.", detalhe: "Prevista para 11/12/2026", status: "atual" as const },
  { rotulo: "3ª parcela · a definir", detalhe: "Sem data confirmada", status: "pendente" as const },
];

export default function DesignLabJanelaPage() {
  const [escuro, setEscuro] = useState(false);
  const [aba, setAba] = useState<Aba>("resumo");
  const paleta = escuro ? corEscuro : cor;

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <FiltroRefracaoSVG />
      <AmbientBackground escuro={escuro} />

      <GlassWindow escuro={escuro} style={{ width: "100%", maxWidth: 760 }}>
        <div style={{ padding: "20px 24px 16px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "flex", gap: 12, minWidth: 0 }}>
            <GlassIconChip Icone={FileText} cor={paleta.destaque} fundo={paleta.destaqueFundo} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", background: paleta.destaque, display: "inline-block", padding: "4px 10px", borderRadius: 999 }}>
                234/2026
              </div>
              <h2 style={{ margin: "8px 0 0", fontSize: 18, color: paleta.texto }}>Aquisição de insumos hospitalares</h2>
              <p style={{ margin: "2px 0 0", fontSize: 12.5, color: paleta.textoTerciario }}>CGECA · NUP 25000.208214/2025-10</p>
            </div>
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

        <div style={{ padding: "0 24px 28px", display: "flex", flexDirection: "column", gap: 16, maxHeight: 440, overflowY: "auto" }}>
          {aba === "resumo" && (
            <>
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
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: paleta.textoTerciario, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>
                  Cronograma de entregas
                </div>
                <GlassTimeline escuro={escuro} itens={CRONOGRAMA} />
              </div>
            </>
          )}

          {aba === "andamentos" && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600, color: paleta.textoTerciario, textTransform: "uppercase", letterSpacing: 0.5 }}>
                <Clock size={13} />
                Histórico de andamentos
              </div>
              <GlassTimeline escuro={escuro} itens={ANDAMENTOS} />
            </>
          )}

          {aba === "relatorio" && (
            <>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600, color: paleta.textoTerciario, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  <MessageSquare size={13} />
                  Relatório de execução
                </div>
                <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: cor.verdeEscuro, background: cor.verdeEscuroFundo, borderRadius: 999, padding: "3px 9px" }}>
                  <CheckCircle2 size={12} />
                  Atualizado há 3 dias
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color: paleta.texto }}>
                Execução dentro do previsto. A 1ª parcela foi entregue e conferida sem divergências de quantidade ou
                especificação técnica. A 2ª parcela está em trânsito, com previsão de entrega em 11/12/2026. Fiscal
                titular acompanha o processo sem pendências registradas até o momento.
              </p>
              <GlassTable
                escuro={escuro}
                colunas={["Item", "Quantidade", "Conferência"]}
                linhas={[
                  ["Desmopressina acetato 0,1mg/ml", "41.000 un.", <span key="a" style={{ color: cor.verdeEscuro, fontWeight: 600 }}>OK</span>],
                  ["Insulina humana NPH", "18.000 un.", <span key="b" style={{ color: cor.atencao, fontWeight: 600 }}>Pendente</span>],
                ]}
              />
            </>
          )}
        </div>
      </GlassWindow>
    </div>
  );
}
