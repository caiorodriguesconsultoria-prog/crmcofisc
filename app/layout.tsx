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
    <html lang="pt-BR">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0 }}>
        {children}
      </body>
    </html>
  );
}
