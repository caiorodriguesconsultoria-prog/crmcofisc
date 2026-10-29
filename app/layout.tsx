import { Urbanist } from "next/font/google";
import "./globals.css";
import SentryUsuario from "./_sentry-usuario";
import { cor } from "@/lib/theme";

// Trocada de Manrope pra Urbanist — mesma fonte do site de referência
// (moorly), que o Caio disse ter gostado ao ver de novo.
const urbanist = Urbanist({ subsets: ["latin"], variable: "--font-urbanist", weight: ["400", "500", "600", "700", "800"] });

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
    <html lang="pt-BR" className={urbanist.variable}>
      <body
        style={{
          fontFamily: "var(--font-urbanist), system-ui, sans-serif",
          margin: 0,
          // Fundo em degradê suave (pedido do Caio, igual ao site de
          // referência) — antes era cor.fundo sólida. Ver globals.css pra o
          // degradê mais forte atrás de cada painel (.crm-painel-fundo etc.).
          background: `linear-gradient(160deg, #EAF4F7 0%, ${cor.fundo} 45%, #F3EFE7 100%)`,
          backgroundAttachment: "fixed",
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
