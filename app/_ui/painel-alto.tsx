import Link from "next/link";
import { cor } from "@/lib/theme";

export default function PainelAlto({
  voltarHref,
  maxWidth = 900,
  topo,
  children,
}: {
  voltarHref: string;
  maxWidth?: number;
  topo: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="crm-painel-alto-fundo">
      <div className="crm-painel-alto" style={{ maxWidth }}>
        <div className="crm-painel-alto-topo">
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>{topo}</div>
            <Link
              href={voltarHref}
              aria-label="Fechar"
              style={{
                flex: "none",
                width: 30,
                height: 30,
                borderRadius: "50%",
                background: "rgba(32,31,29,.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 15,
                color: cor.textoTerciario,
                textDecoration: "none",
              }}
            >
              ×
            </Link>
          </div>
        </div>
        <div className="crm-painel-alto-corpo">{children}</div>
      </div>
    </div>
  );
}
