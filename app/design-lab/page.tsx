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
//
// Layout no desktop (Caio: "ver tudo sem rolar pra cima e pra baixo"):
// cabeçalho + KPIs + grade 3x2 ocupam a altura inteira do viewport
// (100vh, sem scroll), com gaps/paddings mais justos. No mobile continua
// rolando normalmente — a restrição é só pra tela cheia de desktop.
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
    <div style={{ height: desktop ? "100vh" : "auto", minHeight: "100vh", position: "relative", overflow: desktop ? "hidden" : "visible" }}>
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

      <main
        style={{
          marginLeft: desktop ? 288 : 0,
          padding: desktop ? "16px 20px" : "16px 16px 90px",
          maxWidth: 1400,
          height: desktop ? "100vh" : "auto",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", flex: "0 0 auto" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 19, fontWeight: 700, color: paleta.texto }}>Painel</h1>
            <p style={{ margin: "1px 0 0", fontSize: 12, color: paleta.textoTerciario }}>Visão geral da gestão contratual</p>
          </div>
          <div style={{ flex: "1 1 260px", maxWidth: 400 }}>
            <GlassInput escuro={escuro} placeholder="Buscar contrato, medicamento, processo..." />
          </div>
          <GlassButton escuro={escuro} onClick={() => setEscuro((v) => !v)}>
            {escuro ? "Tema escuro" : "Tema claro"}
          </GlassButton>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, flex: "0 0 auto" }}>
          {[
            { rotulo: "Contratos", valor: "17" },
            { rotulo: "Concluídos", valor: "5" },
            { rotulo: "Entrega atrasada", valor: "6" },
            { rotulo: "Relatório desatualizado", valor: "9" },
            { rotulo: "Tarefas pendentes", valor: "2" },
          ].map((k) => (
            <GlassCard key={k.rotulo} escuro={escuro} titulo={k.rotulo} style={{ padding: 12 }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: paleta.texto }}>{k.valor}</div>
            </GlassCard>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gridTemplateRows: "repeat(2, 1fr)", gap: 10, flex: "1 1 auto", minHeight: 0 }}>
          <GlassCard escuro={escuro} titulo="Contratos por etapa" style={{ minHeight: 0, overflow: "hidden" }}>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-end", height: 70, marginTop: 4 }}>
              {[{ v: 10, c: "#3578B8" }, { v: 4, c: "#D19936" }, { v: 3, c: "#2D9570" }, { v: 2, c: "#C66846" }].map((b, i) => (
                <div key={i} style={{ width: 22, height: `${b.v * 6}px`, borderRadius: "6px 6px 0 0", background: b.c }} />
              ))}
            </div>
          </GlassCard>

          <GlassCard escuro={escuro} titulo="Entregas previstas · próximos 30 dias" style={{ minHeight: 0, overflow: "hidden" }}>
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

          <GlassCard escuro={escuro} titulo="Cobertura de férias" style={{ minHeight: 0, overflow: "hidden" }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: paleta.texto }}>75%</div>
            <div style={{ fontSize: 11, color: paleta.textoTerciario, marginTop: 2, marginBottom: 6 }}>3 de 4 coordenações</div>
            <div style={{ height: 6, borderRadius: 999, background: escuro ? "rgba(255,255,255,.12)" : "rgba(32,31,29,.08)" }}>
              <div style={{ width: "75%", height: "100%", borderRadius: 999, background: cor.verdeEscuro }} />
            </div>
          </GlassCard>

          <GlassCard escuro={escuro} titulo="Atividades prioritárias" style={{ minHeight: 0, overflow: "hidden" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12.5, color: paleta.texto }}>
              <div>☐ Inserir pauta de distribuição — Hoje</div>
              <div>☐ Atualizar cronograma de entregas — 26 nov</div>
            </div>
          </GlassCard>

          <GlassCard escuro={escuro} titulo="Contratos com atraso" style={{ minHeight: 0, overflow: "hidden" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12.5, color: paleta.texto }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>294/2026</span>
                <span style={{ color: cor.atencao, fontWeight: 600 }}>84 dias</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>255/2026</span>
                <span style={{ color: cor.atencao, fontWeight: 600 }}>56 dias</span>
              </div>
            </div>
          </GlassCard>

          <GlassSurface escuro={escuro} style={{ padding: 12, minHeight: 0, overflow: "hidden" }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: "#9B7A2E", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 5 }}>Insights da IA · beta</div>
            <p style={{ fontSize: 12.5, color: paleta.texto, margin: "0 0 8px" }}>2 entregas podem atrasar nos próximos 15 dias.</p>
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
