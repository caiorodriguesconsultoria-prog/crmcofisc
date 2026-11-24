"use client";

import { useEffect, useState } from "react";
import AmbientBackground from "./_glass/ambient-background";
import FiltroRefracaoSVG from "./_glass/refracao";
import { GlassCard, GlassButton, GlassInput, GlassTable, GlassAIButton, GlassSidebar, GlassDock, GlassSurface } from "./_glass/componentes";
import { cor, corEscuro } from "@/lib/theme";

// /design-lab — laboratório isolado (CRM_LIQUID_GLASS_SKILLS.md, seção 5):
// dados fictícios, sem mutação real, não é tela do produto. Objetivo:
// comparar o Design System Liquid Glass novo com a referência aprovada
// ANTES de tocar no CRM funcional (seção 10 — aguardar aprovação visual).
export default function DesignLabPage() {
  const [escuro, setEscuro] = useState(false);
  // Protótipo de laboratório, não produto — só pra ter paridade mínima com
  // a referência (sidebar some, dock vira a navegação) na hora de comparar
  // desktop vs. mobile lado a lado.
  const [desktop, setDesktop] = useState(true);
  useEffect(() => {
    const atualizar = () => setDesktop(window.innerWidth >= 768);
    atualizar();
    window.addEventListener("resize", atualizar);
    return () => window.removeEventListener("resize", atualizar);
  }, []);
  const paleta = escuro ? corEscuro : cor;

  return (
    <div style={{ minHeight: "100vh", position: "relative" }}>
      <FiltroRefracaoSVG />
      <AmbientBackground escuro={escuro} />

      {desktop && (
        <GlassSidebar
          escuro={escuro}
          itens={[
            { rotulo: "Painel", ativo: true },
            { rotulo: "Contratos" },
            { rotulo: "Dados" },
            { rotulo: "Cadastros" },
          ]}
        />
      )}

      <main style={{ marginLeft: desktop ? 296 : 0, padding: desktop ? "24px 24px 100px" : "16px 16px 90px", maxWidth: 1400 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: paleta.texto }}>Painel</h1>
            <p style={{ margin: "2px 0 0", fontSize: 13, color: paleta.textoTerciario }}>Visão geral da gestão contratual</p>
          </div>
          <div style={{ flex: "1 1 280px", maxWidth: 420 }}>
            <GlassInput escuro={escuro} placeholder="Buscar contrato, medicamento, processo..." />
          </div>
          <GlassButton escuro={escuro} onClick={() => setEscuro((v) => !v)}>
            {escuro ? "Tema escuro" : "Tema claro"}
          </GlassButton>
        </div>

        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 16 }}>
          {[
            { rotulo: "Contratos", valor: "17" },
            { rotulo: "Concluídos", valor: "5" },
            { rotulo: "Entrega atrasada", valor: "6" },
            { rotulo: "Relatório desatualizado", valor: "9" },
            { rotulo: "Tarefas pendentes", valor: "2" },
          ].map((k) => (
            <div key={k.rotulo} style={{ flex: "1 1 150px", maxWidth: 220 }}>
              <GlassCard escuro={escuro} titulo={k.rotulo}>
                <div style={{ fontSize: 28, fontWeight: 700, color: paleta.texto }}>{k.valor}</div>
              </GlassCard>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 14, marginBottom: 16 }}>
          <GlassCard escuro={escuro} titulo="Contratos por etapa">
            <div style={{ display: "flex", gap: 10, alignItems: "flex-end", height: 110, marginTop: 6 }}>
              {[{ v: 10, c: "#3578B8" }, { v: 4, c: "#D19936" }, { v: 3, c: "#2D9570" }, { v: 2, c: "#C66846" }].map((b, i) => (
                <div key={i} style={{ width: 28, height: `${b.v * 9}px`, borderRadius: "8px 8px 0 0", background: b.c }} />
              ))}
            </div>
          </GlassCard>

          <GlassCard escuro={escuro} titulo="Entregas previstas · próximos 30 dias">
            <GlassTable
              escuro={escuro}
              colunas={["Contrato", "Parcela", "Data"]}
              linhas={[
                ["339/2026", "1ª", "04/12"],
                ["294/2026", "2ª", "11/12"],
                ["305/2026", "1ª", "15/12"],
              ]}
            />
          </GlassCard>

          <GlassCard escuro={escuro} titulo="Cobertura de férias">
            <div style={{ fontSize: 28, fontWeight: 700, color: paleta.texto }}>75%</div>
            <div style={{ fontSize: 12, color: paleta.textoTerciario, marginTop: 2 }}>3 de 4 coordenações</div>
          </GlassCard>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 14 }}>
          <GlassCard escuro={escuro} titulo="Atividades prioritárias">
            <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13, color: paleta.texto }}>
              <div>☐ Inserir pauta de distribuição — Hoje</div>
              <div>☐ Atualizar cronograma de entregas — 26 nov</div>
            </div>
          </GlassCard>

          <GlassSurface escuro={escuro} style={{ padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#9B7A2E", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Insights da IA · beta</div>
            <p style={{ fontSize: 13, color: paleta.texto, margin: "0 0 10px" }}>2 entregas podem atrasar nos próximos 15 dias.</p>
            <GlassButton escuro={escuro} primario>
              Analisar com a IA
            </GlassButton>
          </GlassSurface>
        </div>
      </main>

      <GlassAIButton escuro={escuro} />
      {!desktop && (
        <GlassDock
          escuro={escuro}
          itens={[{ rotulo: "Painel", ativo: true }, { rotulo: "Contratos" }, { rotulo: "Dados" }, { rotulo: "Mais" }]}
        />
      )}
    </div>
  );
}
