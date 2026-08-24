import { Manrope } from "next/font/google";
import NavBar from "./_nav/navbar";
import { cor } from "@/lib/theme";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });

export const metadata = {
  title: "CRM-COFISC",
  description: "Gestão de processos de fiscalização de contratos — COFISC",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
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
        }}
      >
        <NavBar />
        {children}
      </body>
    </html>
  );
}
