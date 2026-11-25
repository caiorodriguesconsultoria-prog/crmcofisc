"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ChevronDown, type LucideIcon } from "lucide-react";
import { cor, corEscuro, raio, elevacao, vidro, vidroNivel, movimento } from "@/lib/theme";
import { backdropRefracao } from "./refracao";

// Fase 9 (CRM_LIQUID_GLASS_SKILLS.md / regra da skill premium-liquid-ui:
// "respeite prefers-reduced-transparency e prefers-contrast"). Estilo
// inline não aceita @media — só dá pra reagir a isso com matchMedia em
// runtime. Hook genérico, reaproveitado pelas duas preferências.
function usePreferenciaMidia(query: string): boolean {
  const [ativo, setAtivo] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    setAtivo(mq.matches);
    const ouvir = (e: MediaQueryListEvent) => setAtivo(e.matches);
    mq.addEventListener("change", ouvir);
    return () => mq.removeEventListener("change", ouvir);
  }, [query]);
  return ativo;
}

// Design System Liquid Glass reutilizável — CRM_LIQUID_GLASS_SKILLS.md,
// seção 6. Protótipo isolado em /design-lab (nenhum componente de produto
// foi alterado ainda — aguardando aprovação visual, seção 10). Reaproveita
// os tokens já criados na Etapa 1 (vidro.padrao ~50%, vidro.intenso ~70%,
// elevacao, corEscuro) em vez de inventar uma segunda paleta/escala.
//
// Separação de camadas (seção 6): fundo ambiental (AmbientBackground, outro
// arquivo) → camada óptica (backdrop-filter/blur) → material (gradientes de
// luz) → borda/reflexo (border-top mais claro) → conteúdo. Cada função
// abaixo monta essas camadas uma vez, pros componentes só usarem o
// resultado.

type Intensidade = "padrao" | "intenso";

function materialVidro(
  intensidade: Intensidade,
  escuro: boolean,
  alphaFundoOverride?: number,
  transparenciaReduzida?: boolean,
  maisContraste?: boolean
): React.CSSProperties {
  const preset = vidro[intensidade];
  // Override pontual (Caio: janela ~50% opaco/mais vidro, cards ~70% opaco/
  // mais sólido) — não mexe nos presets padrao/intenso compartilhados
  // (sidebar, dock, popover continuam na calibração anterior).
  const alphaFundo = transparenciaReduzida ? 0.97 : alphaFundoOverride ?? preset.alphaFundo;
  const luz = escuro ? "255,255,255" : "255,255,255";
  const sombraBase = escuro ? "0,0,0" : "32,31,29";
  // prefers-reduced-transparency: igual ao fallback já validado em produção
  // (.crm-painel-alto, ver app/globals.css) — quase opaco, SEM
  // backdrop-filter nenhum (nem o blur simples do Safari). prefers-contrast:
  // more reforça a borda (mais visível = mais fácil de perceber o limite
  // do card contra o fundo).
  const bordaAlpha = maisContraste ? { l: 0.18, r: 0.22, b: 0.26, t: escuro ? 0.4 : 1 } : { l: escuro ? 0.05 : 0.06, r: escuro ? 0.08 : 0.09, b: escuro ? 0.09 : 0.1, t: escuro ? 0.22 : 0.95 };
  return {
    background: `radial-gradient(130% 100% at 20% 0%, rgba(${luz},${escuro ? 0.1 : 0.55}) 0%, rgba(${luz},0) 55%),
      linear-gradient(180deg, rgba(${luz},${escuro ? 0.07 : 0.35}) 0%, rgba(${luz},0) 32%, rgba(${sombraBase},${escuro ? 0.3 : 0.04}) 100%),
      ${escuro ? `rgba(14,21,38,${alphaFundo - 0.08})` : `rgba(255,255,255,${alphaFundo})`}`,
    // Propriedade sem prefixo recebe a refração (feDisplacementMap via
    // url(#vidro-refracao), ver refracao.tsx) — motores que não entendem
    // filtro de referência em backdrop-filter (WebKit, historicamente)
    // simplesmente ignoram a propriedade inteira. Por isso a versão
    // -webkit- continua só com blur/saturate puro, como fallback real do
    // Safari/iOS, não decorativo — sem isso, Safari perderia o vidro por
    // completo em vez de cair pro blur. Só testado em Chromium (Playwright)
    // neste ambiente; sem evidência de WebKit/Firefox.
    backdropFilter: transparenciaReduzida ? "none" : backdropRefracao(preset.blur, preset.saturate),
    WebkitBackdropFilter: transparenciaReduzida ? "none" : `blur(${preset.blur}px) saturate(${preset.saturate}%)`,
    borderLeft: `1px solid rgba(${escuro ? "255,255,255" : sombraBase},${bordaAlpha.l})`,
    borderRight: `1px solid rgba(${escuro ? "255,255,255" : sombraBase},${bordaAlpha.r})`,
    borderBottom: `1px solid rgba(${escuro ? "255,255,255" : sombraBase},${bordaAlpha.b})`,
    borderTop: `1px solid rgba(255,255,255,${bordaAlpha.t})`,
    boxShadow: [
      `inset 0 1px 1px rgba(255,255,255,${escuro ? 0.12 : 0.8})`,
      `inset 0 -10px 16px -8px rgba(${sombraBase},${escuro ? 0.4 : 0.1})`,
      `inset 10px 0 16px -12px rgba(255,255,255,${escuro ? 0.06 : 0.5})`,
      `0 1px 2px rgba(${sombraBase},${escuro ? 0.35 : 0.08})`,
      `0 24px 60px rgba(${sombraBase},${escuro ? 0.55 : 0.18})`,
    ].join(", "),
  };
}

type PropsBase = {
  escuro?: boolean;
  intensidade?: Intensidade;
  alphaFundo?: number;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  // Pass-through solto pro motion.div interno (entrada escalonada da fase
  // 8) — tipado como `any` de propósito: isto é laboratório, não vale a
  // pena importar os tipos completos do framer-motion só pra isso.
  variants?: any;
  initial?: any;
  animate?: any;
};

/** Superfície de vidro genérica — base de todos os outros componentes. */
export function GlassSurface({ escuro, intensidade = "padrao", alphaFundo, style, children, variants, initial, animate }: PropsBase) {
  const transparenciaReduzida = usePreferenciaMidia("(prefers-reduced-transparency: reduce)");
  const maisContraste = usePreferenciaMidia("(prefers-contrast: more)");
  return (
    <motion.div
      variants={variants}
      initial={initial}
      animate={animate}
      style={{ borderRadius: raio.card, zIndex: elevacao.card, ...materialVidro(intensidade, !!escuro, alphaFundo, transparenciaReduzida, maisContraste), ...style }}
    >
      {children}
    </motion.div>
  );
}

/** Card pequeno (KPI, widget) — ~70% opaco (Caio): mais sólido que a janela,
 * já que carrega número/texto curto, mas ainda com vidro visível. */
export function GlassCard({ escuro, titulo, style, children, variants, initial, animate }: PropsBase & { titulo?: string }) {
  const paleta = escuro ? corEscuro : cor;
  return (
    <GlassSurface escuro={escuro} alphaFundo={vidroNivel.cartao} variants={variants} initial={initial} animate={animate} style={{ padding: 16, ...style }}>
      {titulo && <div style={{ fontSize: 11, fontWeight: 600, color: paleta.textoTerciario, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>{titulo}</div>}
      {children}
    </GlassSurface>
  );
}

/** Janela elevada (contrato aberto, modais) — ~50% opaco (Caio): mais vidro,
 * mais transparente que os cards, porque é a superfície decorativa principal
 * da tela; nunca "intenso" aqui: janela carrega texto denso/tabela, intensidade
 * alta é reservada pra elementos de navegação/decoração (seção 6: "evitar
 * vidro excessivo em listas densas"). */
export function GlassWindow({ escuro, style, children }: PropsBase) {
  return (
    <GlassSurface escuro={escuro} intensidade="padrao" alphaFundo={vidroNivel.janela} style={{ borderRadius: raio.painel, zIndex: elevacao.janela, padding: 0, overflow: "hidden", ...style }}>
      {children}
    </GlassSurface>
  );
}

/** Mesa/tabela — superfície de LEITURA sólida (seção 6: "usar superfícies
 * de leitura mais sólidas para tabelas"), não vidro. Fica dentro de uma
 * GlassWindow/GlassCard, nunca sozinha flutuando. */
export function GlassTable({ escuro, colunas, linhas }: { escuro?: boolean; colunas: string[]; linhas: (string | React.ReactNode)[][] }) {
  const paleta = escuro ? corEscuro : cor;
  return (
    <div style={{ borderRadius: raio.campo, overflow: "hidden", background: escuro ? "rgba(6,11,22,.55)" : "rgba(255,255,255,.75)", border: `1px solid ${paleta.borda}` }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: `1px solid ${paleta.borda}` }}>
            {colunas.map((c) => (
              <th key={c} style={{ padding: "9px 12px", color: paleta.textoTerciario, fontWeight: 600, fontSize: 11 }}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {linhas.map((linha, i) => (
            <tr key={i} style={{ borderBottom: i < linhas.length - 1 ? `1px solid ${paleta.borda}` : "none" }}>
              {linha.map((valor, j) => (
                <td key={j} style={{ padding: "9px 12px", color: paleta.texto }}>
                  {valor}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Chip de ícone colorido (cabeçalho de KPI) — mesma linguagem visual da
 * referência aprovada (ícone num círculo/quadrado pastel por card). */
export function GlassIconChip({ Icone, cor: corIcone, fundo }: { Icone: LucideIcon; cor: string; fundo: string }) {
  return (
    <div style={{ width: 32, height: 32, borderRadius: 10, background: fundo, color: corIcone, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
      <Icone size={16} />
    </div>
  );
}

/** Donut/rosca com legenda — "Contratos por etapa" na referência usa rosca,
 * não barra. Desenhado à mão (sem recharts) pra não empilhar outra
 * dependência só pro laboratório: cada fatia é um `<circle>` com
 * `strokeDasharray`/`strokeDashoffset` acumulado. */
export function GlassDonut({
  escuro,
  dados,
  total,
  rotuloCentro,
}: {
  escuro?: boolean;
  dados: { rotulo: string; valor: number; cor: string }[];
  total: number;
  rotuloCentro?: string;
}) {
  const paleta = escuro ? corEscuro : cor;
  const r = 32;
  const circunferencia = 2 * Math.PI * r;
  let acumulado = 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, minWidth: 0 }}>
      <div style={{ position: "relative", width: 84, height: 84, flex: "none" }}>
        <svg width={84} height={84} viewBox="0 0 84 84" style={{ transform: "rotate(-90deg)" }}>
          {dados.map((d) => {
            const comprimento = (d.valor / total) * circunferencia;
            const elemento = (
              <circle
                key={d.rotulo}
                cx={42}
                cy={42}
                r={r}
                fill="none"
                stroke={d.cor}
                strokeWidth={11}
                strokeDasharray={`${comprimento} ${circunferencia - comprimento}`}
                strokeDashoffset={-acumulado}
              />
            );
            acumulado += comprimento;
            return elemento;
          })}
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: paleta.texto, lineHeight: 1 }}>{total}</div>
          {rotuloCentro && <div style={{ fontSize: 8.5, color: paleta.textoTerciario, marginTop: 3 }}>{rotuloCentro}</div>}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 11.5, minWidth: 0, flex: 1 }}>
        {dados.map((d) => (
          <div key={d.rotulo} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: d.cor, flex: "none" }} />
            <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: paleta.texto }}>{d.rotulo}</span>
            <span style={{ color: paleta.textoTerciario, flex: "none" }}>{d.valor}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Timeline numerada (cronograma de entregas, andamentos) — bolinha +
 * linha conectora por item; status muda a cor da bolinha. Referência
 * aprovada mostra isso na janela do contrato no mobile ("Cronograma de
 * entregas"), em vez da tabela simples usada na primeira versão. */
export function GlassTimeline({
  escuro,
  itens,
}: {
  escuro?: boolean;
  itens: { rotulo: string; detalhe?: string; status: "concluido" | "atual" | "pendente" }[];
}) {
  const paleta = escuro ? corEscuro : cor;
  const corStatus = { concluido: cor.verdeEscuro, atual: cor.atencao, pendente: paleta.textoTerciario };
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {itens.map((it, i) => (
        <div key={it.rotulo} style={{ display: "flex", gap: 10 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 16, flex: "none" }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: corStatus[it.status], marginTop: 3, flex: "none" }} />
            {i < itens.length - 1 && <span style={{ width: 2, flex: 1, background: paleta.borda, minHeight: 22 }} />}
          </div>
          <div style={{ paddingBottom: i < itens.length - 1 ? 14 : 0, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: paleta.texto }}>{it.rotulo}</div>
            {it.detalhe && <div style={{ fontSize: 11.5, color: paleta.textoTerciario, marginTop: 1 }}>{it.detalhe}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Botão volumétrico — camada de luz no topo + sombra de contato, em vez
 * de cor plana; "press" comprime (seção 8, spring moderada). */
export function GlassButton({
  escuro,
  primario,
  children,
  onClick,
}: {
  escuro?: boolean;
  primario?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  const reduzido = useReducedMotion();
  const paleta = escuro ? corEscuro : cor;
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={reduzido ? undefined : { scale: 0.96 }}
      transition={movimento.springPress}
      style={{
        cursor: "pointer",
        padding: "10px 18px",
        minHeight: 44,
        borderRadius: raio.pilula,
        fontSize: 13.5,
        fontWeight: 700,
        color: primario ? "#fff" : paleta.texto,
        background: primario
          ? `linear-gradient(180deg, rgba(255,255,255,.22) 0%, rgba(255,255,255,0) 60%), ${paleta.destaque}`
          : `linear-gradient(180deg, rgba(255,255,255,${escuro ? 0.08 : 0.6}) 0%, rgba(255,255,255,0) 60%), ${escuro ? "rgba(255,255,255,.08)" : "rgba(255,255,255,.55)"}`,
        boxShadow: primario
          ? `0 1px 1px rgba(255,255,255,.3) inset, 0 8px 20px ${paleta.destaqueFundo}`
          : `0 1px 1px rgba(255,255,255,${escuro ? 0.1 : 0.7}) inset, 0 2px 6px rgba(0,0,0,.08)`,
        border: `1px solid ${primario ? "rgba(255,255,255,.2)" : paleta.borda}`,
      }}
    >
      {children}
    </motion.button>
  );
}

/** Campo de texto — mesma ideia de superfície "quase sólida" de leitura. */
export function GlassInput({ escuro, placeholder }: { escuro?: boolean; placeholder?: string }) {
  const paleta = escuro ? corEscuro : cor;
  return (
    <input
      placeholder={placeholder}
      style={{
        width: "100%",
        padding: "10px 14px",
        borderRadius: raio.campo,
        border: `1px solid ${paleta.borda}`,
        background: escuro ? "rgba(6,11,22,.6)" : "rgba(255,255,255,.7)",
        color: paleta.texto,
        fontSize: 13.5,
      }}
    />
  );
}

/** Abas seguimentadas em vidro — mesma mecânica do ControleSegmentado já em
 * produção (app/_ui/controle-segmentado.tsx), só com fundo translúcido em
 * vez de cinza sólido, pra combinar com o resto do laboratório. */
export function GlassTabs<T extends string>({
  escuro,
  opcoes,
  valor,
  aoMudar,
}: {
  escuro?: boolean;
  opcoes: { valor: T; rotulo: string }[];
  valor: T;
  aoMudar: (v: T) => void;
}) {
  const reduzido = useReducedMotion();
  const paleta = escuro ? corEscuro : cor;
  // Alvo de toque de 44px é regra pra mobile (fase 9) — no desktop a pílula
  // compacta de 13/16px já é alvo de mouse normal, inflar pra 44 ali deixaria
  // a aba gigante e feia à toa.
  const mobile = usePreferenciaMidia("(max-width: 767px)");
  const idGrupo = `glass-tabs-${opcoes.map((o) => o.valor).join("-")}`;
  return (
    <div
      role="tablist"
      style={{
        display: "inline-flex",
        gap: 2,
        padding: 3,
        borderRadius: raio.pilula,
        background: escuro ? "rgba(255,255,255,.06)" : "rgba(255,255,255,.4)",
        border: `1px solid ${paleta.borda}`,
      }}
    >
      {opcoes.map((o) => {
        const ativo = o.valor === valor;
        return (
          <button
            key={o.valor}
            role="tab"
            type="button"
            onClick={() => aoMudar(o.valor)}
            style={{
              position: "relative",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              padding: "7px 16px",
              minHeight: mobile ? 44 : undefined,
              fontSize: 13,
              fontWeight: 600,
              color: ativo ? "#fff" : paleta.textoSecundario,
              borderRadius: raio.pilula,
            }}
          >
            {ativo && (
              <motion.span
                layoutId={idGrupo}
                transition={reduzido ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 35 }}
                style={{ position: "absolute", inset: 0, borderRadius: raio.pilula, background: paleta.destaque, zIndex: 0 }}
              />
            )}
            <span style={{ position: "relative", zIndex: 1 }}>{o.rotulo}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Popover em vidro — mesmo material "padrao", elevação popover. */
export function GlassPopover({ escuro, style, children }: PropsBase) {
  return (
    <GlassSurface escuro={escuro} style={{ borderRadius: raio.card, zIndex: elevacao.popover, padding: 10, ...style }}>
      {children}
    </GlassSurface>
  );
}

/** Sheet (mobile) — vidro intenso (~70%), sobe do rodapé. */
export function GlassSheet({ escuro, aberto, children }: PropsBase & { aberto: boolean }) {
  const reduzido = useReducedMotion();
  const transparenciaReduzida = usePreferenciaMidia("(prefers-reduced-transparency: reduce)");
  const maisContraste = usePreferenciaMidia("(prefers-contrast: more)");
  if (!aberto) return null;
  return (
    <motion.div
      initial={reduzido ? false : { y: "100%" }}
      animate={{ y: 0 }}
      transition={{ duration: movimento.janela, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: "fixed",
        zIndex: elevacao.popover,
        left: 0,
        right: 0,
        bottom: 0,
        borderTopLeftRadius: raio.painel,
        borderTopRightRadius: raio.painel,
        padding: 18,
        ...materialVidro("intenso", !!escuro, undefined, transparenciaReduzida, maisContraste),
      }}
    >
      {children}
    </motion.div>
  );
}

/** Botão flutuante do assistente de IA — volumétrico, com leve glow.
 * Motion Design (fase 8, CRM_LIQUID_GLASS_SKILLS.md): respiração sutil no
 * glow externo (não no próprio botão, que ficaria irritante de olhar
 * fixo) — só roda com `prefers-reduced-motion` desligado. */
export function GlassAIButton({ escuro }: { escuro?: boolean }) {
  const paleta = escuro ? corEscuro : cor;
  const reduzido = useReducedMotion();
  return (
    <motion.button
      type="button"
      aria-label="Assistente de IA"
      whileTap={{ scale: 0.94 }}
      animate={
        reduzido
          ? undefined
          : { boxShadow: ["0 1px 1px rgba(255,255,255,.4) inset, 0 10px 26px rgba(47,95,219,.4)", "0 1px 1px rgba(255,255,255,.4) inset, 0 10px 34px rgba(47,95,219,.6)", "0 1px 1px rgba(255,255,255,.4) inset, 0 10px 26px rgba(47,95,219,.4)"] }
      }
      transition={reduzido ? movimento.springPress : { boxShadow: { duration: 2.6, repeat: Infinity, ease: "easeInOut" }, scale: movimento.springPress }}
      style={{
        position: "fixed",
        zIndex: elevacao.notificacao,
        right: 24,
        bottom: 24,
        width: 56,
        height: 56,
        borderRadius: "50%",
        border: "1px solid rgba(255,255,255,.3)",
        cursor: "pointer",
        background: `radial-gradient(60% 60% at 30% 25%, rgba(255,255,255,.5) 0%, rgba(255,255,255,0) 60%), linear-gradient(160deg, ${paleta.destaque}, #7A5CF0)`,
        boxShadow: `0 1px 1px rgba(255,255,255,.4) inset, 0 10px 26px rgba(47,95,219,.4)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontSize: 22,
      }}
    >
      ✦
    </motion.button>
  );
}

/** Dock inferior (mobile) — barra flutuante translúcida, não fixa na borda
 * (seção 7: "dock inferior"). */
export function GlassDock({
  escuro,
  itens,
}: {
  escuro?: boolean;
  itens: { rotulo: string; Icone: LucideIcon; ativo?: boolean }[];
}) {
  const paleta = escuro ? corEscuro : cor;
  const transparenciaReduzida = usePreferenciaMidia("(prefers-reduced-transparency: reduce)");
  const maisContraste = usePreferenciaMidia("(prefers-contrast: more)");
  return (
    <div
      style={{
        position: "fixed",
        zIndex: elevacao.navegacao,
        left: 16,
        right: 16,
        bottom: 16,
        borderRadius: raio.painel,
        padding: "10px 8px",
        display: "flex",
        justifyContent: "space-around",
        ...materialVidro("intenso", !!escuro, undefined, transparenciaReduzida, maisContraste),
      }}
    >
      {itens.map((i) => (
        // <button>, não <div> — alvo de toque real (fase 9: acessibilidade).
        // Min. 44px de altura (WCAG 2.5.5/skill premium-liquid-ui) e SEM
        // `outline: none`: o anel de foco padrão do navegador continua
        // visível no teclado, de propósito.
        <button
          key={i.rotulo}
          type="button"
          aria-current={i.ativo ? "page" : undefined}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 3,
            minWidth: 44,
            minHeight: 44,
            padding: "4px 10px",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            borderRadius: raio.campo,
            fontSize: 10,
            fontWeight: 600,
            color: i.ativo ? paleta.destaque : paleta.textoTerciario,
          }}
        >
          <i.Icone size={18} />
          {i.rotulo}
        </button>
      ))}
    </div>
  );
}

/** Sidebar flutuante em vidro (desktop) — mesma estrutura da BarraLateral de
 * produção (app/_ui/barra-lateral.tsx: ícones por item, grupo "Cadastros"
 * expansível, rodapé de conta), só com o material glass em vez da classe
 * .crm-cartao-vidro-claro, pra comparar lado a lado no laboratório. */
export function GlassSidebar({
  escuro,
  itens,
  grupoCadastros,
  contaNome = "COFISC",
  contaEmail = "Administrador",
  children,
}: PropsBase & {
  itens: { rotulo: string; Icone: LucideIcon; ativo?: boolean }[];
  grupoCadastros?: { rotulo: string; Icone: LucideIcon }[];
  contaNome?: string;
  contaEmail?: string;
}) {
  const [aberto, setAberto] = useState(true);
  const paleta = escuro ? corEscuro : cor;
  const reduzido = useReducedMotion();
  const transparenciaReduzida = usePreferenciaMidia("(prefers-reduced-transparency: reduce)");
  const maisContraste = usePreferenciaMidia("(prefers-contrast: more)");
  return (
    <aside style={{ position: "fixed", zIndex: elevacao.navegacao, left: 16, top: 16, bottom: 16, width: 240, display: "flex", flexDirection: "column", borderRadius: raio.painel, padding: "16px 10px", ...materialVidro("padrao", !!escuro, undefined, transparenciaReduzida, maisContraste) }}>
      <div style={{ padding: "2px 10px 14px" }}>
        <div style={{ fontWeight: 800, fontSize: 15, color: paleta.texto, letterSpacing: -0.2 }}>COFISC</div>
        <div style={{ fontSize: 10.5, color: paleta.textoTerciario, marginTop: 1 }}>Gestão Contratual</div>
      </div>

      <nav style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1, overflowY: "auto" }}>
        {itens.map((i) => (
          // <button>, não <div> (fase 9): sem isso o item nunca recebia foco
          // de teclado — parecia navegável, mas Tab pulava direto por cima.
          <button
            key={i.rotulo}
            type="button"
            aria-current={i.ativo ? "page" : undefined}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              width: "100%",
              minHeight: 44,
              padding: "8px 10px",
              border: "none",
              borderRadius: raio.campo,
              fontSize: 13,
              fontWeight: 600,
              textAlign: "left",
              cursor: "pointer",
              color: i.ativo ? "#fff" : paleta.textoSecundario,
              background: i.ativo ? paleta.destaque : "transparent",
            }}
          >
            <i.Icone size={15} />
            <span>{i.rotulo}</span>
          </button>
        ))}

        {grupoCadastros && grupoCadastros.length > 0 && (
          <>
            <button
              type="button"
              onClick={() => setAberto((v) => !v)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                padding: "10px 10px 4px",
                fontSize: 10.5,
                fontWeight: 700,
                color: paleta.textoTerciario,
                textTransform: "uppercase",
                letterSpacing: 0.6,
              }}
            >
              Cadastros
              <motion.span animate={{ rotate: aberto ? 0 : -90 }} transition={reduzido ? { duration: 0 } : movimento.springPress} style={{ display: "flex" }}>
                <ChevronDown size={13} />
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {aberto && (
                <motion.div
                  key="grupo-cadastros"
                  initial={reduzido ? false : { height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={reduzido ? undefined : { height: 0, opacity: 0 }}
                  transition={{ duration: reduzido ? 0 : 0.18, ease: [0.22, 1, 0.36, 1] }}
                  style={{ overflow: "hidden" }}
                >
                  {grupoCadastros.map((i) => (
                    <button
                      key={i.rotulo}
                      type="button"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 9,
                        width: "100%",
                        minHeight: 40,
                        padding: "7px 10px",
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        textAlign: "left",
                        borderRadius: raio.campo,
                        fontSize: 12.5,
                        fontWeight: 600,
                        color: paleta.textoSecundario,
                      }}
                    >
                      <i.Icone size={14} />
                      <span>{i.rotulo}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </nav>

      <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 10px 2px", borderTop: `1px solid ${paleta.borda}`, marginTop: 6 }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: paleta.destaqueFundo, color: paleta.destaque, fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
          CA
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: paleta.texto }}>{contaNome}</div>
          <div style={{ fontSize: 10, color: paleta.textoTerciario, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{contaEmail}</div>
        </div>
      </div>
      {children}
    </aside>
  );
}

export function useAbrirFechar(inicial = false) {
  return useState(inicial);
}
