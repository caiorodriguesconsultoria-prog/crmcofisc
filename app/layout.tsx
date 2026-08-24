import { Manrope } from "next/font/google";
import "./globals.css";
import Sidebar, { type Atividade } from "./_nav/sidebar";
import { cor } from "@/lib/theme";
import { createClient } from "@/lib/supabase/server";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });

export const metadata = {
  title: "CRM-COFISC",
  description: "Gestão de processos de fiscalização de contratos — COFISC",
};

const KANBAN_DOT = "#7E9B7E";
const EVENTO_DOT = "#B0655C";

async function buscarAtividades(): Promise<Atividade[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const [{ data: processos }, { data: tagsEvento }, { data: processoTags }] = await Promise.all([
    supabase.from("processos").select("etapa_atual"),
    supabase.from("tags").select("id, valor").eq("categoria", "evento").eq("ativo", true).order("valor"),
    supabase.from("processo_tags").select("tag_id"),
  ]);

  const KANBANS = [
    "Ofício de apresentação",
    "Aguardando entrega",
    "Aguardando assinatura",
    "Aguardando pagamento",
    "Aguardando Área Técnica",
  ];

  const porEtapa = new Map<string, number>();
  for (const p of processos ?? []) {
    porEtapa.set(p.etapa_atual, (porEtapa.get(p.etapa_atual) ?? 0) + 1);
  }

  const porTag = new Map<string, number>();
  for (const t of processoTags ?? []) {
    porTag.set(t.tag_id, (porTag.get(t.tag_id) ?? 0) + 1);
  }

  const atividadesKanban: Atividade[] = KANBANS.map((nome) => ({
    label: nome,
    count: porEtapa.get(nome) ?? 0,
    href: `/processos?etapa=${encodeURIComponent(nome)}`,
    dot: KANBAN_DOT,
  }));

  const atividadesEvento: Atividade[] = (tagsEvento ?? []).map((t) => ({
    label: t.valor,
    count: porTag.get(t.id) ?? 0,
    href: `/processos?evento=${t.id}`,
    dot: EVENTO_DOT,
  }));

  return [...atividadesKanban, ...atividadesEvento];
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const atividades = await buscarAtividades();

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
        <Sidebar atividades={atividades} />
        <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
      </body>
    </html>
  );
}
