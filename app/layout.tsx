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
          // Fundo em degradê (pedido do Caio, igual ao site de referência —
          // a 1ª tentativa ficou sutil demais, quase igual ao fundo sólido
          // de antes; essas cores vêm direto do CSS do site, convertidas de
          // oklch pra hex, pra garantir que fique visivelmente colorido).
          background: "linear-gradient(135deg, #D7F3F8 0%, #FFE0B2 35%, #BCE8E7 65%, #83C1DD 100%)",
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
