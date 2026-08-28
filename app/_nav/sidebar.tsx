"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cor } from "@/lib/theme";

const LINKS = [
  { href: "/dashboard", label: "Painel" },
  { href: "/processos", label: "Processos" },
  { href: "/processos/concluidos", label: "Concluídos" },
  { href: "/dados", label: "Dados" },
  { href: "/agenda", label: "Agenda" },
  { href: "/coordenacoes", label: "Coordenações" },
  { href: "/gestores", label: "Gestores" },
  { href: "/fiscais", label: "Fiscais" },
  { href: "/fornecedores", label: "Fornecedores" },
];

export type Atividade = { label: string; count: number; href: string; dot: string; id?: string };

export default function Sidebar({ children }: { children?: React.ReactNode }) {
  const pathname = usePathname();
  const [aberta, setAberta] = useState(false);

  useEffect(() => {
    setAberta(false);
  }, [pathname]);

  if (pathname === "/login" || pathname === "/") return null;

  return (
    <>
      <button
        type="button"
        className={`crm-sidebar-toggle${aberta ? " recuado" : ""}`}
        aria-label="Abrir menu"
        onClick={() => setAberta(true)}
        style={{ width: 38, height: 38, borderRadius: "50%", padding: 0, alignItems: "center", justifyContent: "center" }}
      >
        ☰
      </button>
      {aberta && <div className="crm-sidebar-scrim" onClick={() => setAberta(false)} />}
      <nav
        className={`crm-sidebar${aberta ? " aberta" : ""}`}
        onClick={(e) => {
          // Fecha a gaveta ao clicar em qualquer link de navegação lá dentro —
          // inclusive os atalhos de Atividades, que trocam só a query string
          // (mesmo pathname), então o useEffect abaixo (que só olha pathname)
          // não detectaria essa navegação e a gaveta ficaria aberta por cima
          // da tela filtrada.
          if ((e.target as HTMLElement).closest("a")) setAberta(false);
        }}
        style={{
          flex: "none",
          height: "100vh",
          background: cor.branco,
          borderRight: `1px solid ${cor.borda}`,
          padding: "18px 14px",
          display: "flex",
          flexDirection: "column",
          gap: 4,
          overflowY: "auto",
        }}
      >
      <div style={{ display: "flex", alignItems: "center", padding: "4px 8px 16px" }}>
        {/* Mesmo gradiente do ícone do app (app/icon.tsx) — replicado em CSS
        em vez de <img src="/icon-192">, porque assim escala nítido em
        qualquer tamanho e não gasta uma requisição extra. */}
        <span
          style={{
            padding: "6px 14px",
            borderRadius: 10,
            background: "linear-gradient(90deg, #22C1DC 0%, #8FD79A 50%, #F4E266 100%)",
            color: "#000",
            fontWeight: 800,
            fontSize: 14,
            letterSpacing: -0.3,
          }}
        >
          COFISC
        </span>
      </div>

      {LINKS.map((l) => {
        // "/processos" não deve acender junto com "/processos/concluidos"
        // (que também começa com "/processos/") — cada rota tem seu item.
        const ativo =
          pathname === l.href ||
          (pathname.startsWith(l.href + "/") &&
            !(l.href === "/processos" && pathname.startsWith("/processos/concluidos")));
        const estilo: React.CSSProperties = {
          fontSize: 13,
          fontWeight: 600,
          padding: "9px 12px",
          borderRadius: 10,
          color: ativo ? "#fff" : cor.textoSecundario,
          background: ativo ? "linear-gradient(180deg,#4A4645,#2D2B2B)" : "transparent",
          textDecoration: "none",
        };
        // /processos/concluidos tem o mesmo formato de URL que a rota
        // interceptada do modal /processos/[id] — <a> normal (navegação
        // completa) pra não cair lá, mesma causa raiz do bug de "+ Novo processo".
        if (l.href === "/processos/concluidos") {
          return (
            <a key={l.href} href={l.href} style={estilo}>
              {l.label}
            </a>
          );
        }
        return (
          <Link key={l.href} href={l.href} style={estilo}>
            {l.label}
          </Link>
        );
      })}

      {children}

      <form action="/logout" method="post" style={{ marginTop: "auto", paddingTop: 12 }}>
        <button
          type="submit"
          style={{
            width: "100%",
            fontSize: 12,
            fontWeight: 600,
            color: cor.textoSecundario,
            background: "transparent",
            border: `1px solid ${cor.borda}`,
          }}
        >
          Sair
        </button>
      </form>
      </nav>
    </>
  );
}
