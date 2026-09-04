import { Manrope } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import Sidebar from "./_nav/sidebar";
import Atividades from "./_nav/atividades";
import { cor } from "@/lib/theme";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });

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
    <html lang="pt-BR" className={manrope.variable}>
      <body
        style={{
          fontFamily: "var(--font-manrope), system-ui, sans-serif",
          margin: 0,
          background: cor.fundo,
          color: cor.texto,
          minHeight: "100vh",
          display: "flex",
        }}
      >
        <Sidebar>
          <Suspense fallback={null}>
            <Atividades />
          </Suspense>
        </Sidebar>
        <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
        {modal}
      </body>
    </html>
  );
}
