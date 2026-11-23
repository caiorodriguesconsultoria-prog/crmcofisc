import { Inter } from "next/font/google";
import "./globals.css";
import SentryUsuario from "./_sentry-usuario";
import { cor } from "@/lib/theme";

// Trocada de Nunito pra Inter — Caio reportou que Nunito (terminais
// arredondados, "fofa") ainda não batia com a referência (prints de app
// estilo Apple/"Flutter Your Way"). Olhando de novo, a fonte da
// referência é neutra/geométrica, sem arredondamento nenhum — muito mais
// perto da própria SF Pro/system font da Apple (que não é de uso livre
// na web) do que de uma fonte "rounded". Inter é a referência mais
// comum pra imitar esse visual de UI nativa, com números tabulares bons
// e ótima leitura em tamanho pequeno.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", weight: ["400", "500", "600", "700", "800"] });

export const metadata = {
  title: "CRM-COFISC",
  description: "Gestão de processos de fiscalização de contratos — COFISC",
  appleWebApp: { title: "COFISC" },
};

export const viewport = {
  themeColor: "#2F5FDB",
};

export default function RootLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body
        className="crm-fundo-aurora"
        style={{
          fontFamily: "var(--font-inter), system-ui, sans-serif",
          margin: 0,
          // Fundo em degradê suave ("aurora", ver .crm-fundo-aurora em
          // globals.css) — pedido explícito do Caio a partir de uma
          // referência visual, aplicado no body pra cobrir TODA página,
          // inclusive a barra de navegação no topo (antes só o Painel por
          // dentro tinha o degradê, a barra ficava branca por cima).
          color: cor.texto,
          minHeight: "100vh",
          display: "flex",
        }}
      >
        <SentryUsuario />
        <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
        {modal}
      </body>
    </html>
  );
}
