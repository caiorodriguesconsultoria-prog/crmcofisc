"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, FileText, BarChart3, Users, Building2, Tag, Truck, Calendar, Sparkles, Bell, CheckCircle2, LogOut, type LucideIcon } from "lucide-react";
import { cor, raio, elevacao, botaoPrimario } from "@/lib/theme";
import NotificacoesPush from "@/app/_nav/notificacoes-push";

// Sidebar flutuante do desktop (CRM Premium, Etapa 2 — navegação, seção 4
// do CRM_PREMIUM_SPEC.md, layout inspirado na imagem de referência do
// Caio). Substitui a barra de pílulas no topo SÓ no desktop (≥768px) —
// .crm-barra-lateral fica escondida em telas menores, onde a navegação
// continua sendo a barra inferior de BarraTopo (inalterada nesta etapa,
// exceto a troca do 3º item de Agenda pra Dados, ver barra-topo.tsx).
// Renderizada de dentro de BarraTopo (não em cada page.tsx) — qualquer tela
// que já usa <BarraTopo> ou <TelaComBarraTopo> ganha a sidebar de graça.
const ITENS_PRINCIPAIS = [
  { href: "/dashboard", label: "Painel", Icone: LayoutGrid },
  { href: "/processos", label: "Contratos", Icone: FileText, contador: "processos" as const },
  { href: "/dados", label: "Dados", Icone: BarChart3 },
];

const ITENS_CADASTROS = [
  { href: "/gestores", label: "Gestores e Fiscais", Icone: Users },
  { href: "/coordenacoes", label: "Coordenações", Icone: Building2 },
  { href: "/tags", label: "Tags", Icone: Tag },
  { href: "/fornecedores", label: "Fornecedores", Icone: Truck },
];

// Ainda sem cápsula/seção própria na Etapa 2 (Agenda sai do menu principal
// por pedido da especificação, mas os dados continuam acessíveis — ver
// seção 4: "retirar Agenda do menu, não seus dados ou funcionalidades").
// Ressurgem em local definitivo nas Etapas 3 (Painel) e 6 (assistente
// flutuante/notificações); até lá ficam aqui, visíveis, não escondidos.
const ITENS_MAIS = [
  { href: "/processos/concluidos", label: "Concluídos", Icone: CheckCircle2 },
  { href: "/agenda", label: "Agenda", Icone: Calendar, contador: "agenda" as const },
  { href: "/assistente", label: "Assistente (IA)", Icone: Sparkles },
  { href: "/avisos", label: "Avisos", Icone: Bell, alerta: true },
];

function ItemNav({
  href,
  label,
  Icone,
  ativo,
  contador,
}: {
  href: string;
  label: string;
  Icone: LucideIcon;
  ativo: boolean;
  contador?: number;
}) {
  return (
    <Link
      href={href}
      className="crm-pilula-hover"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 12px",
        borderRadius: raio.campo,
        fontSize: 13.5,
        fontWeight: 600,
        textDecoration: "none",
        color: ativo ? "#fff" : cor.textoSecundario,
        background: ativo ? cor.destaque : "transparent",
      }}
    >
      <Icone size={16} />
      <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
      {contador != null && contador > 0 && (
        <span
          style={{
            fontSize: 10.5,
            fontWeight: 700,
            padding: "1px 6px",
            borderRadius: raio.pilula,
            background: ativo ? "rgba(255,255,255,.25)" : cor.borda,
            color: ativo ? "#fff" : cor.textoSecundario,
            flex: "none",
          }}
        >
          {contador}
        </span>
      )}
    </Link>
  );
}

function RotuloSecao({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 10.5, fontWeight: 700, color: cor.textoTerciario, textTransform: "uppercase", letterSpacing: 0.6, padding: "10px 12px 4px" }}>
      {children}
    </div>
  );
}

export default function BarraLateral({
  contagemProcessosAtivos,
  contagemAgendaHoje,
  temAlerta,
  iniciaisUsuario,
  emailUsuario,
}: {
  contagemProcessosAtivos: number;
  contagemAgendaHoje: number;
  temAlerta: boolean;
  iniciaisUsuario: string;
  emailUsuario?: string;
}) {
  const pathname = usePathname();
  const [menuAberto, setMenuAberto] = useState(false);

  const contadores: Record<string, number> = {
    processos: contagemProcessosAtivos,
    agenda: contagemAgendaHoje,
  };

  function estaAtivo(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <aside
      className="crm-barra-lateral crm-cartao-vidro-claro"
      style={{ zIndex: elevacao.navegacao, borderRadius: raio.painel }}
    >
      <div style={{ padding: "18px 14px 6px" }}>
        <div style={{ fontWeight: 800, fontSize: 16, color: cor.texto, letterSpacing: -0.3 }}>COFISC</div>
        <div style={{ fontSize: 11.5, color: cor.textoTerciario, marginTop: 1 }}>Gestão Contratual</div>
      </div>

      <div style={{ padding: "4px 10px 0" }}>
        {/* A barra de topo antiga tinha esse botão fixo em toda tela — virou
           parte da sidebar na Etapa 2 (nenhuma linha de topo sobra no
           desktop pra abrigar isso, ver barra-topo.tsx). */}
        <Link href="/processos/novo" style={{ ...botaoPrimario, display: "block", textAlign: "center", textDecoration: "none" }}>
          + Novo contrato
        </Link>
      </div>

      <nav style={{ display: "flex", flexDirection: "column", gap: 2, padding: "10px 10px 0", overflowY: "auto", flex: 1 }}>
        {ITENS_PRINCIPAIS.map((i) => (
          <ItemNav key={i.href} href={i.href} label={i.label} Icone={i.Icone} ativo={estaAtivo(i.href)} contador={i.contador ? contadores[i.contador] : undefined} />
        ))}

        <RotuloSecao>Cadastros</RotuloSecao>
        {ITENS_CADASTROS.map((i) => (
          <ItemNav key={i.href} href={i.href} label={i.label} Icone={i.Icone} ativo={estaAtivo(i.href)} />
        ))}

        <RotuloSecao>Mais</RotuloSecao>
        {ITENS_MAIS.map((i) => (
          <ItemNav
            key={i.href}
            href={i.href}
            label={i.alerta && temAlerta ? `${i.label} •` : i.label}
            Icone={i.Icone}
            ativo={estaAtivo(i.href)}
            contador={i.contador ? contadores[i.contador] : undefined}
          />
        ))}
      </nav>

      <div style={{ position: "relative", padding: 10, borderTop: `1px solid ${cor.borda}`, marginTop: 6 }}>
        <button
          type="button"
          onClick={() => setMenuAberto((v) => !v)}
          aria-label="Menu da conta"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            width: "100%",
            padding: "8px 8px",
            borderRadius: raio.campo,
            border: "none",
            background: "transparent",
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: cor.destaqueFundo,
              color: cor.destaque,
              fontSize: 12,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flex: "none",
            }}
          >
            {iniciaisUsuario}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: cor.texto }}>COFISC</div>
            <div style={{ fontSize: 11, color: cor.textoTerciario, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {emailUsuario ?? "Administrador"}
            </div>
          </div>
        </button>

        {menuAberto && (
          <>
            <div onClick={() => setMenuAberto(false)} style={{ position: "fixed", inset: 0, zIndex: elevacao.popover - 1 }} />
            <div
              style={{
                position: "absolute",
                zIndex: elevacao.popover,
                bottom: "calc(100% + 6px)",
                left: 10,
                right: 10,
                background: "rgba(255,255,255,.98)",
                border: `1px solid ${cor.borda}`,
                borderRadius: 12,
                boxShadow: "0 10px 30px rgba(32,31,29,.16)",
                padding: 6,
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              <div style={{ padding: "4px 6px 8px" }}>
                <NotificacoesPush />
              </div>
              <form action="/logout" method="post">
                <button
                  type="submit"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    width: "100%",
                    textAlign: "left",
                    padding: "8px 8px",
                    fontSize: 13,
                    fontWeight: 600,
                    color: cor.textoSecundario,
                    background: "transparent",
                    border: "none",
                    borderRadius: 9,
                  }}
                >
                  <LogOut size={14} />
                  Sair
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
