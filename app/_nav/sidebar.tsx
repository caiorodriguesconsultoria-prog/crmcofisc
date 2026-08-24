"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cor } from "@/lib/theme";

const LINKS = [
  { href: "/dashboard", label: "Painel" },
  { href: "/processos", label: "Processos" },
  { href: "/kanban", label: "Kanban" },
  { href: "/agenda", label: "Agenda" },
  { href: "/coordenacoes", label: "Coordenações" },
  { href: "/gestores", label: "Gestores" },
  { href: "/fiscais", label: "Fiscais" },
  { href: "/fornecedores", label: "Fornecedores" },
];

export type Atividade = { label: string; count: number; href: string; dot: string };

export default function Sidebar({ atividades }: { atividades: Atividade[] }) {
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
        className="crm-sidebar-toggle"
        aria-label="Abrir menu"
        onClick={() => setAberta(true)}
        style={{ width: 38, height: 38, borderRadius: "50%", padding: 0, alignItems: "center", justifyContent: "center" }}
      >
        ☰
      </button>
      {aberta && <div className="crm-sidebar-scrim" onClick={() => setAberta(false)} />}
      <nav
        className={`crm-sidebar${aberta ? " aberta" : ""}`}
        style={{
          flex: "none",
          width: 240,
          height: "100vh",
          position: "sticky",
          top: 0,
          background: cor.branco,
          borderRight: `1px solid ${cor.borda}`,
          padding: "18px 14px",
          display: "flex",
          flexDirection: "column",
          gap: 4,
          overflowY: "auto",
        }}
      >
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 8px 16px" }}>
        <span
          style={{
            width: 26,
            height: 26,
            borderRadius: "50%",
            background: "linear-gradient(180deg,#4A4645,#2D2B2B)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            fontWeight: 700,
            flex: "none",
          }}
        >
          C
        </span>
        <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: -0.2 }}>COFISC</span>
      </div>

      {LINKS.map((l) => {
        const ativo = pathname === l.href || pathname.startsWith(l.href + "/");
        return (
          <Link
            key={l.href}
            href={l.href}
            style={{
              fontSize: 13,
              fontWeight: 600,
              padding: "9px 12px",
              borderRadius: 10,
              color: ativo ? "#fff" : cor.textoSecundario,
              background: ativo ? "linear-gradient(180deg,#4A4645,#2D2B2B)" : "transparent",
              textDecoration: "none",
            }}
          >
            {l.label}
          </Link>
        );
      })}

      {atividades.length > 0 && (
        <>
          <div
            style={{
              fontSize: 10.5,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: 1,
              color: cor.textoTerciario,
              padding: "20px 12px 4px",
            }}
          >
            Atividades
          </div>
          {atividades.map((a) => (
            <Link
              key={a.label}
              href={a.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 12.5,
                fontWeight: 500,
                padding: "7px 12px",
                borderRadius: 10,
                color: cor.texto,
                textDecoration: "none",
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: a.dot, flex: "none" }} />
              <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {a.label}
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 600, color: cor.textoTerciario }}>{a.count}</span>
            </Link>
          ))}
        </>
      )}

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
