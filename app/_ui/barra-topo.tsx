"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ChevronDown, Menu } from "lucide-react";
import { cor, raio } from "@/lib/theme";

// Navegação do Painel, no formato de cápsulas do novo design (ver
// design-system/REGRAS.md). Por enquanto só aparece em /dashboard — as
// outras telas continuam com a gaveta lateral (app/_nav/sidebar.tsx) até
// passarem pelo redesenho nas próprias etapas (3 em diante). Evita trocar a
// navegação do sistema inteiro de uma vez só numa etapa que é só do Painel.
const ABAS = [
  { href: "/dashboard", label: "Painel" },
  { href: "/processos", label: "Contratos" },
  { href: "/agenda", label: "Agenda" },
];

// Itens que ainda não têm cápsula própria — ficam no menu "Mais" pra não
// perder nenhum acesso que já existia na gaveta lateral.
const MAIS = [
  { href: "/processos/concluidos", label: "Concluídos" },
  { href: "/dados", label: "Dados" },
  { href: "/avisos", label: "Avisos" },
  { href: "/coordenacoes", label: "Coordenações" },
  { href: "/gestores", label: "Gestores" },
  { href: "/fiscais", label: "Fiscais" },
  { href: "/fornecedores", label: "Fornecedores" },
];

export default function BarraTopo({
  contagemProcessosAtivos,
  contagemAgendaHoje,
  temAlerta,
  iniciaisUsuario,
  emailUsuario,
  atualizadoEm,
  migalha,
}: {
  contagemProcessosAtivos: number;
  contagemAgendaHoje: number;
  temAlerta: boolean;
  iniciaisUsuario: string;
  emailUsuario?: string;
  atualizadoEm: string;
  /** Texto da trilha de navegação (2ª linha, só desktop). Padrão: nome da aba ativa. */
  migalha?: string;
}) {
  const pathname = usePathname();
  const [maisAberto, setMaisAberto] = useState(false);
  const abaAtiva = ABAS.find((a) => pathname === a.href || pathname.startsWith(a.href + "/"));

  const contadores: Record<string, number> = {
    "/processos": contagemProcessosAtivos,
    "/agenda": contagemAgendaHoje,
  };

  return (
    <div className="crm-barra-topo">
      <div className="crm-barra-topo-linha1">
        <span
          style={{
            padding: "6px 14px",
            borderRadius: 10,
            background: "linear-gradient(90deg, #22C1DC 0%, #8FD79A 50%, #F4E266 100%)",
            color: "#000",
            fontWeight: 800,
            fontSize: 14,
            letterSpacing: -0.3,
            flex: "none",
          }}
        >
          COFISC
        </span>

        <nav className="crm-barra-topo-abas" aria-label="Navegação principal">
          {ABAS.map((a) => {
            const ativa = pathname === a.href || pathname.startsWith(a.href + "/");
            const contador = contadores[a.href];
            return (
              <Link
                key={a.href}
                href={a.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 14px",
                  borderRadius: raio.pilula,
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: "none",
                  color: ativa ? "#fff" : cor.textoSecundario,
                  background: ativa ? cor.escuro : "transparent",
                  flex: "none",
                }}
              >
                {a.label}
                {contador != null && contador > 0 && (
                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 700,
                      padding: "1px 6px",
                      borderRadius: raio.pilula,
                      background: ativa ? "rgba(255,255,255,.22)" : cor.borda,
                      color: ativa ? "#fff" : cor.textoSecundario,
                    }}
                  >
                    {contador}
                  </span>
                )}
              </Link>
            );
          })}

          <div style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() => setMaisAberto((v) => !v)}
              aria-expanded={maisAberto}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "8px 12px",
                borderRadius: raio.pilula,
                border: "none",
                fontSize: 13,
                fontWeight: 600,
                color: cor.textoSecundario,
                background: "transparent",
              }}
            >
              Mais
              <ChevronDown size={14} />
            </button>
          </div>
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginLeft: "auto", flex: "none" }}>
          <a
            href="/processos/novo"
            style={{
              padding: "9px 16px",
              borderRadius: raio.pilula,
              background: cor.escuro,
              color: "#fff",
              fontSize: 12.5,
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            + Novo contrato
          </a>
          <Link
            href="/avisos"
            aria-label={temAlerta ? "Avisos (há pendências)" : "Avisos"}
            style={{ position: "relative", display: "flex", width: 34, height: 34, borderRadius: "50%", alignItems: "center", justifyContent: "center", background: cor.fundo, color: cor.textoSecundario }}
          >
            <Bell size={16} />
            {temAlerta && (
              <span
                style={{ position: "absolute", top: 6, right: 7, width: 8, height: 8, borderRadius: "50%", background: cor.urgente, border: `2px solid ${cor.branco}` }}
              />
            )}
          </Link>
          <div
            aria-label={emailUsuario ? `Logado como ${emailUsuario}` : "Usuário logado"}
            title={emailUsuario}
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: cor.destaqueFundo,
              color: cor.destaque,
              fontSize: 12,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {iniciaisUsuario}
          </div>
        </div>
      </div>

      <div className="crm-barra-topo-linha2">
        <span style={{ color: cor.textoTerciario }}>{migalha ?? abaAtiva?.label ?? "Painel"}</span>
        <span style={{ marginLeft: "auto", color: cor.textoTerciario }}>Atualizado às {atualizadoEm}</span>
      </div>

      <nav className="crm-barra-topo-mobile" aria-label="Navegação principal">
        {ABAS.map((a) => {
          const ativa = pathname === a.href || pathname.startsWith(a.href + "/");
          return (
            <Link
              key={a.href}
              href={a.href}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, flex: 1, textDecoration: "none", color: ativa ? cor.escuro : cor.textoTerciario, fontSize: 11, fontWeight: 600 }}
            >
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: ativa ? cor.escuro : "transparent" }} />
              {a.label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMaisAberto((v) => !v)}
          aria-label="Mais opções"
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, flex: 1, border: "none", background: "transparent", color: cor.textoTerciario, fontSize: 11, fontWeight: 600 }}
        >
          <Menu size={16} />
          Mais
        </button>
      </nav>

      {maisAberto && (
        <>
          <div onClick={() => setMaisAberto(false)} style={{ position: "fixed", inset: 0, zIndex: 44 }} />
          <div className="crm-barra-topo-mais-painel">
            {MAIS.map((m) => (
              <a
                key={m.href}
                href={m.href}
                onClick={() => setMaisAberto(false)}
                style={{ padding: "10px 14px", borderRadius: 9, fontSize: 13.5, fontWeight: 600, color: cor.texto, textDecoration: "none" }}
              >
                {m.label}
              </a>
            ))}
            <form action="/logout" method="post" style={{ marginTop: 4, borderTop: `1px solid ${cor.borda}`, paddingTop: 6 }}>
              <button
                type="submit"
                style={{ width: "100%", textAlign: "left", padding: "10px 14px", fontSize: 13.5, fontWeight: 600, color: cor.textoSecundario, background: "transparent", border: "none" }}
              >
                Sair
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
