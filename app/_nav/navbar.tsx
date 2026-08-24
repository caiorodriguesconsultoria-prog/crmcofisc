"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cor } from "@/lib/theme";

const LINKS = [
  { href: "/dashboard", label: "Painel" },
  { href: "/processos", label: "Processos" },
  { href: "/kanban", label: "Kanban" },
  { href: "/agenda", label: "Agenda" },
  { href: "/fornecedores", label: "Fornecedores" },
  { href: "/coordenacoes", label: "Coordenações" },
  { href: "/gestores", label: "Gestores" },
  { href: "/fiscais", label: "Fiscais" },
];

export default function NavBar() {
  const pathname = usePathname();

  if (pathname === "/login" || pathname === "/") return null;

  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        flexWrap: "wrap",
        padding: "14px 32px",
        background: cor.branco,
        borderBottom: `1px solid ${cor.borda}`,
      }}
    >
      <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: -0.2, marginRight: 12 }}>
        CRM-COFISC
      </span>
      {LINKS.map((l) => {
        const ativo = pathname === l.href || pathname.startsWith(l.href + "/");
        return (
          <Link
            key={l.href}
            href={l.href}
            style={{
              fontSize: 12.5,
              fontWeight: 600,
              padding: "8px 13px",
              borderRadius: 20,
              color: ativo ? "#fff" : cor.textoSecundario,
              background: ativo ? "linear-gradient(180deg,#4A4645,#2D2B2B)" : "transparent",
              textDecoration: "none",
            }}
          >
            {l.label}
          </Link>
        );
      })}
      <form action="/logout" method="post" style={{ marginLeft: "auto" }}>
        <button
          type="submit"
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: cor.textoSecundario,
            background: "transparent",
            border: `1px solid ${cor.borda}`,
            borderRadius: 20,
            padding: "7px 14px",
            cursor: "pointer",
          }}
        >
          Sair
        </button>
      </form>
    </nav>
  );
}
