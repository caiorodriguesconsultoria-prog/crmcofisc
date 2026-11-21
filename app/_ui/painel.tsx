import Link from "next/link";
import { cor } from "@/lib/theme";
import { corEscura } from "@/lib/tema-escuro";
import TituloDestaque from "./titulo";

export default function Painel({
  titulo,
  subtitulo,
  voltarHref,
  maxWidth = 900,
  acao,
  conteudoTitulo,
  children,
  temaEscuro,
}: {
  titulo: string;
  subtitulo?: string;
  voltarHref?: string;
  maxWidth?: number;
  acao?: React.ReactNode;
  // Troca o título grande por outro conteúdo (ex.: a busca do Painel na
  // Etapa 2 do redesenho) sem mudar nenhuma outra tela que não passe isso.
  conteudoTitulo?: React.ReactNode;
  children: React.ReactNode;
  // Protótipo isolado (pedido do Caio, referência "Furniture CRM" + paleta
  // de marrons) — só muda o fundo quando passado explicitamente; nenhuma
  // outra tela é afetada. Ver lib/tema-escuro.ts.
  temaEscuro?: boolean;
}) {
  return (
    <div className="crm-painel-fundo" style={temaEscuro ? { background: corEscura.fundo, minHeight: "100vh" } : undefined}>
      <div
        className="crm-painel"
        style={
          temaEscuro
            ? { maxWidth, background: "transparent", boxShadow: "none", border: "none" }
            : { maxWidth }
        }
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 18 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {conteudoTitulo ?? (
              <>
                <TituloDestaque fontSize={20}>{titulo}</TituloDestaque>
                {subtitulo && (
                  <p style={{ fontSize: 12.5, color: cor.textoSecundario, margin: "4px 0 0" }}>{subtitulo}</p>
                )}
              </>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flex: "none" }}>
            {acao}
            {voltarHref && (
              <Link
                href={voltarHref}
                aria-label="Fechar"
                style={{
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
            )}
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
