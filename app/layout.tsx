import { Nunito } from "next/font/google";
import "./globals.css";
import SentryUsuario from "./_sentry-usuario";
import { cor } from "@/lib/theme";

// Trocada de Urbanist pra Nunito — mais próxima da fonte arredondada das
// referências que o Caio trouxe (apps estilo Apple/Instagram, print do
// "Flutter Your Way"); SF Pro Rounded em si não é uma fonte de uso livre
// na web, Nunito é a mais parecida (terminais arredondados, boa leitura
// em tamanho pequeno pros números/rótulos densos do CRM).
const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito", weight: ["400", "500", "600", "700", "800"] });

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
    <html lang="pt-BR" className={nunito.variable}>
      <body
        style={{
          fontFamily: "var(--font-nunito), system-ui, sans-serif",
          margin: 0,
          // Fundo em cor plana (uma rampa neutra só) — o degradê multi-tom
          // que tinha aqui (pra bater com o site de referência) foi retirado
          // a pedido do Caio: gradiente de fundo é um dos sinais mais comuns
          // de interface com "cara de IA" (auditoria de design, regras de
          // cor). cor.fundo é o mesmo neutro já usado em todo o resto do
          // sistema.
          background: cor.fundo,
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
