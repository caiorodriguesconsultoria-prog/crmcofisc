"use client";

import { useEffect, useState } from "react";
import NumberFlow from "@number-flow/react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  LayoutGrid,
  FileText,
  BarChart3,
  Users,
  Building2,
  Tag,
  Truck,
  CheckCircle2,
  AlertTriangle,
  FileWarning,
  ClipboardList,
  Bell,
  ArrowRight,
  ChevronDown,
  MoreHorizontal,
} from "lucide-react";
import AmbientBackground from "./_glass/ambient-background";
import FiltroRefracaoSVG from "./_glass/refracao";
import { GlassCard, GlassButton, GlassInput, GlassTable, GlassAIButton, GlassSidebar, GlassDock, GlassSurface, GlassIconChip, GlassDonut, GlassSparkline, GlassPopover } from "./_glass/componentes";
import { cor, corEscuro, movimento, raio, elevacao } from "@/lib/theme";

// /design-lab — laboratório isolado (CRM_LIQUID_GLASS_SKILLS.md, seção 5):
// dados fictícios, sem mutação real, não é tela do produto. Objetivo:
// comparar o Design System Liquid Glass novo com a referência aprovada
// ANTES de tocar no CRM funcional (seção 10 — aguardar aprovação visual).
//
// Layout no desktop (Caio: "ver tudo sem rolar pra cima e pra baixo"):
// cabeçalho + KPIs + grade 3x2 ocupam a altura inteira do viewport
// (100vh, sem scroll), com gaps/paddings justos e todos os cards da mesma
// grade com a mesma largura/altura (CSS Grid com fr — nunca um maior/mais
// alto que o outro). No mobile continua rolando normalmente — a restrição
// de altura é só pra tela cheia de desktop.
const KPIS = [
  { rotulo: "Contratos", valor: "17", Icone: FileText, corIcone: "#2F5FDB", fundo: "rgba(47,95,219,.12)", legenda: "12 ativos · 5 concluídos", tendencia: [12, 13, 14, 15, 16, 16, 17] },
  { rotulo: "Concluídos", valor: "5", Icone: CheckCircle2, corIcone: cor.verdeEscuro, fundo: cor.verdeEscuroFundo, delta: "+25%", deltaCor: cor.verdeEscuro, tendencia: [2, 2, 3, 3, 4, 4, 5] },
  { rotulo: "Entrega atrasada", valor: "6", Icone: AlertTriangle, corIcone: cor.urgente, fundo: cor.urgenteFundo, delta: "+2", deltaCor: cor.urgente, tendencia: [3, 3, 4, 4, 5, 5, 6] },
  { rotulo: "Relatório desatualizado", valor: "9", Icone: FileWarning, corIcone: cor.atencao, fundo: cor.atencaoFundo, delta: "-3", deltaCor: cor.verdeEscuro, tendencia: [12, 12, 11, 10, 10, 9, 9] },
  { rotulo: "Tarefas pendentes", valor: "2", Icone: ClipboardList, corIcone: "#6A5ACD", fundo: "rgba(106,90,205,.12)", tendencia: [4, 3, 3, 2, 3, 2, 2] },
];

// Passo 5 ("CRM Premium" — aperfeiçoar filtros): cada item tem `dias`
// (dias a partir de hoje, fictício) pra o filtro "Próximos N dias" filtrar
// de verdade, não só mudar o rótulo.
const ENTREGAS_PREVISTAS = [
  { c: "339/2026", item: "Desmopressina", d: "04/12", dias: 4 },
  { c: "294/2026", item: "Rivastigmina", d: "11/12", dias: 9 },
  { c: "305/2026", item: "Insulina Humana", d: "15/12", dias: 18 },
  { c: "196/2026", item: "Material cirúrgico", d: "22/12", dias: 28 },
];

export default function DesignLabPage() {
  const [escuro, setEscuro] = useState(false);
  // Fase 11 (CRM Premium — auditoria de recursos externos): @number-flow/
  // react (MIT) nos valores de KPI — número troca com animação de dígito,
  // em vez de aparecer/sumir. `bump` é só pra ter algo que muda de
  // verdade no laboratório (produto real vai trocar quando os dados
  // mudarem, não precisa desse botão).
  const [bump, setBump] = useState(0);
  // Filtro de verdade (passo 5) — "Próximos N dias" em Entregas previstas.
  const [janelaEntregas, setJanelaEntregas] = useState<7 | 15 | 30>(30);
  const [filtroAberto, setFiltroAberto] = useState(false);
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
  const reduzido = useReducedMotion();
  // Motion Design (fase 8): entrada escalonada dos cards — cada grade tem
  // seu próprio container pai com staggerChildren, os itens herdam a
  // variante "item" (fade + leve subida). Roda uma vez por montagem da
  // página, não a cada clique de tema/dock; desligado por completo com
  // prefers-reduced-motion (sem delay nem transform, só aparece).
  const grade = reduzido
    ? { escondido: {}, visivel: {} }
    : { escondido: { opacity: 0 }, visivel: { opacity: 1, transition: { staggerChildren: 0.045 } } };
  const item = reduzido
    ? { escondido: {}, visivel: {} }
    : { escondido: { opacity: 0, y: 10 }, visivel: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] } } };

  return (
    <div style={{ height: desktop ? "100vh" : "auto", minHeight: "100vh", position: "relative", overflow: desktop ? "hidden" : "visible" }}>
      <FiltroRefracaoSVG />
      <AmbientBackground escuro={escuro} />

      {desktop && (
        <GlassSidebar
          escuro={escuro}
          itens={[
            { rotulo: "Painel", Icone: LayoutGrid, ativo: true },
            { rotulo: "Contratos", Icone: FileText },
            { rotulo: "Dados", Icone: BarChart3 },
          ]}
          grupoCadastros={[
            { rotulo: "Gestores e Fiscais", Icone: Users },
            { rotulo: "Coordenações", Icone: Building2 },
            { rotulo: "Tags", Icone: Tag },
            { rotulo: "Fornecedores", Icone: Truck },
          ]}
        />
      )}

      <main
        style={{
          marginLeft: desktop ? 288 : 0,
          padding: desktop ? "20px 24px" : "16px 16px 90px",
          maxWidth: 1400,
          height: desktop ? "100vh" : "auto",
          display: "flex",
          flexDirection: "column",
          justifyContent: desktop ? "center" : "flex-start",
          gap: 16,
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", flex: "0 0 auto" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 19, fontWeight: 700, color: paleta.texto }}>Painel</h1>
            <p style={{ margin: "1px 0 0", fontSize: 12, color: paleta.textoTerciario }}>Visão geral da gestão contratual</p>
          </div>
          <div style={{ flex: "1 1 260px", maxWidth: 400, position: "relative" }}>
            <GlassInput escuro={escuro} placeholder="Buscar contrato, medicamento, processo..." />
            <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 10.5, fontWeight: 600, color: paleta.textoTerciario, border: `1px solid ${paleta.borda}`, borderRadius: 5, padding: "1px 5px", pointerEvents: "none" }}>
              ⌘K
            </span>
          </div>
          <button
            type="button"
            aria-label="Notificações"
            style={{
              position: "relative",
              width: 44,
              height: 44,
              borderRadius: "50%",
              border: `1px solid ${paleta.borda}`,
              background: escuro ? "rgba(255,255,255,.08)" : "rgba(255,255,255,.55)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: paleta.textoSecundario,
              cursor: "pointer",
            }}
          >
            <Bell size={16} />
            <motion.span
              animate={reduzido ? undefined : { scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
              transition={reduzido ? undefined : { duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              style={{ position: "absolute", top: 7, right: 8, width: 7, height: 7, borderRadius: "50%", background: cor.urgente, border: `1.5px solid ${escuro ? "#0E1526" : "#fff"}` }}
            />
          </button>
          <GlassButton escuro={escuro} onClick={() => setBump((v) => (v === 0 ? 3 : 0))}>
            Simular atualização
          </GlassButton>
          <GlassButton escuro={escuro} onClick={() => setEscuro((v) => !v)}>
            {escuro ? "Tema escuro" : "Tema claro"}
          </GlassButton>
        </div>

        <motion.div variants={grade} initial="escondido" animate="visivel" style={{ display: "grid", gridTemplateColumns: desktop ? "repeat(5, 1fr)" : "repeat(2, 1fr)", gap: 12, flex: "0 0 auto" }}>
          {KPIS.map((k) => (
            <GlassCard key={k.rotulo} escuro={escuro} variants={item} style={{ padding: 16 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 6 }}>
                <GlassIconChip Icone={k.Icone} cor={k.corIcone} fundo={k.fundo} />
                {k.delta && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: k.deltaCor, background: escuro ? "rgba(255,255,255,.08)" : "rgba(32,31,29,.05)", borderRadius: 999, padding: "2px 8px" }}>
                    {k.delta.startsWith("-") ? "↓" : "↑"}
                    {k.delta}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, color: paleta.texto, marginTop: 12 }}>
                <NumberFlow value={Number(k.valor) + bump} />
              </div>
              <div style={{ fontSize: 12, color: paleta.textoTerciario, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{k.legenda ?? k.rotulo}</div>
              <div style={{ marginTop: 8 }}>
                <GlassSparkline dados={k.tendencia} cor={k.corIcone} />
              </div>
            </GlassCard>
          ))}
        </motion.div>

        <motion.div variants={grade} initial="escondido" animate="visivel" style={{ display: "grid", gridTemplateColumns: desktop ? "repeat(3, 1fr)" : "1fr", gridTemplateRows: desktop ? "repeat(2, auto)" : "none", gap: 12, flex: "0 0 auto" }}>
          <GlassCard escuro={escuro} titulo="Contratos por etapa" variants={item}>
            <GlassDonut
              escuro={escuro}
              total={17}
              rotuloCentro="Contratos"
              dados={[
                { rotulo: "Assinatura", valor: 10, cor: "#3578B8" },
                { rotulo: "Produção", valor: 4, cor: "#D19936" },
                { rotulo: "Entrega", valor: 2, cor: "#2D9570" },
                { rotulo: "Fiscalização", valor: 1, cor: "#9B6EC8" },
              ]}
            />
          </GlassCard>

          <GlassCard escuro={escuro} variants={item} style={{ overflow: "visible" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, position: "relative" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: paleta.textoTerciario, textTransform: "uppercase", letterSpacing: 0.5 }}>Entregas previstas</div>
              <button
                type="button"
                onClick={() => setFiltroAberto((v) => !v)}
                style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, color: paleta.textoSecundario, background: "transparent", border: "none", cursor: "pointer", padding: "4px 2px" }}
              >
                Próximos {janelaEntregas} dias <ChevronDown size={12} />
              </button>
              <AnimatePresence>
              {filtroAberto && (
                <>
                  <div key="overlay-filtro" onClick={() => setFiltroAberto(false)} style={{ position: "fixed", inset: 0, zIndex: elevacao.popover - 1 }} />
                  <GlassPopover key="popover-filtro" escuro={escuro} style={{ position: "absolute", top: "100%", right: 0, marginTop: 4, padding: 4, minWidth: 120 }}>
                    {([7, 15, 30] as const).map((dias) => (
                      <button
                        key={dias}
                        type="button"
                        onClick={() => {
                          setJanelaEntregas(dias);
                          setFiltroAberto(false);
                        }}
                        style={{
                          display: "block",
                          width: "100%",
                          textAlign: "left",
                          padding: "7px 10px",
                          border: "none",
                          borderRadius: raio.campo,
                          background: dias === janelaEntregas ? paleta.destaqueFundo : "transparent",
                          color: dias === janelaEntregas ? paleta.destaque : paleta.texto,
                          fontSize: 12.5,
                          fontWeight: dias === janelaEntregas ? 700 : 500,
                          cursor: "pointer",
                        }}
                      >
                        Próximos {dias} dias
                      </button>
                    ))}
                  </GlassPopover>
                </>
              )}
              </AnimatePresence>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              {ENTREGAS_PREVISTAS.filter((e) => e.dias <= janelaEntregas).map((e) => (
                <div key={e.c} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
                  <div style={{ width: 26, height: 26, borderRadius: "50%", background: paleta.destaqueFundo, color: paleta.destaque, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                    <FileText size={13} />
                  </div>
                  <span style={{ flex: 1, minWidth: 0, color: paleta.texto, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {e.c} <span style={{ fontWeight: 400, color: paleta.textoTerciario }}>· {e.item}</span>
                  </span>
                  <span style={{ color: paleta.textoTerciario, flex: "none" }}>{e.d}</span>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard escuro={escuro} titulo="Cobertura de férias" variants={item}>
            <div style={{ fontSize: 26, fontWeight: 700, color: paleta.texto }}>75%</div>
            <div style={{ fontSize: 12, color: paleta.textoTerciario, marginTop: 3, marginBottom: 10 }}>3 de 4 coordenações</div>
            <div style={{ height: 8, borderRadius: 999, background: escuro ? "rgba(255,255,255,.12)" : "rgba(32,31,29,.08)" }}>
              <div style={{ width: "75%", height: "100%", borderRadius: 999, background: cor.verdeEscuro }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 14, fontSize: 12 }}>
              {[
                { c: "CGECA", ok: true },
                { c: "CGLOG", ok: true },
                { c: "CGAF", ok: false },
              ].map((co) => (
                <div key={co.c} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: co.ok ? cor.verdeEscuro : cor.atencao, flex: "none" }} />
                  <span style={{ color: paleta.texto }}>{co.c}</span>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard escuro={escuro} variants={item} style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: paleta.textoTerciario, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Atividades prioritárias</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13, color: paleta.texto, flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                <span>☐ Inserir pauta de distribuição</span>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: cor.urgente, background: cor.urgenteFundo, borderRadius: 999, padding: "2px 7px", flex: "none" }}>Hoje</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                <span>☐ Atualizar cronograma de entregas</span>
                <span style={{ fontSize: 10.5, color: paleta.textoTerciario, flex: "none" }}>26 nov</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                <span>☐ Revisar relatório de execução</span>
                <span style={{ fontSize: 10.5, color: paleta.textoTerciario, flex: "none" }}>29 nov</span>
              </div>
            </div>
            {/* fase 9: cor.destaque sobre o vidro translúcido do card media
               4.23:1 numa amostragem real (abaixo do mínimo 4,5:1 da WCAG AA
               pra texto pequeno) — cor.azulEscuro é o mesmo acento, mais
               escuro, só pra texto/link em cima de vidro claro. */}
            <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 12, fontWeight: 600, color: escuro ? paleta.destaque : cor.azulEscuro, marginTop: 10 }}>
              Ver todas as tarefas <ArrowRight size={12} />
            </span>
          </GlassCard>

          <GlassCard escuro={escuro} variants={item}>
            <div style={{ fontSize: 11, fontWeight: 600, color: paleta.textoTerciario, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Contratos com atraso</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13 }}>
              {[
                { c: "294/2026", dias: "84 dias" },
                { c: "20/2026", dias: "68 dias" },
                { c: "255/2026", dias: "56 dias" },
              ].map((item) => (
                <div key={item.c} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                  <span style={{ color: paleta.texto, fontWeight: 600 }}>{item.c}</span>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: cor.atencao, background: cor.atencaoFundo, borderRadius: 999, padding: "2px 7px", flex: "none" }}>{item.dias}</span>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassSurface escuro={escuro} variants={item} style={{ padding: 16, display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#9B7A2E", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Insights da IA · beta</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13, color: paleta.texto, flex: 1 }}>
              <div>• 2 entregas podem atrasar nos próximos 15 dias.</div>
              <div>• 1 relatório está há mais de 30 dias sem atualização.</div>
              <div>• Considere pactuar nova data para o contrato 294/2026.</div>
            </div>
            <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 12.5, fontWeight: 700, color: escuro ? paleta.destaque : cor.azulEscuro, marginTop: 10 }}>
              Analisar com a IA <ArrowRight size={13} />
            </span>
          </GlassSurface>
        </motion.div>
      </main>

      <GlassAIButton escuro={escuro} />
      {!desktop && (
        <GlassDock
          escuro={escuro}
          itens={[
            { rotulo: "Painel", Icone: LayoutGrid, ativo: true },
            { rotulo: "Contratos", Icone: FileText },
            { rotulo: "Dados", Icone: BarChart3 },
            { rotulo: "Mais", Icone: MoreHorizontal },
          ]}
        />
      )}
    </div>
  );
}
