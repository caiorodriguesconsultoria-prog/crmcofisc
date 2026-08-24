import Link from "next/link";
import { cor } from "@/lib/theme";
import { createClient } from "@/lib/supabase/server";
import type { Atividade } from "./sidebar";

const KANBAN_DOT = "#7E9B7E";
const EVENTO_DOT = "#B0655C";

const KANBANS = [
  "Ofício de apresentação",
  "Aguardando entrega",
  "Aguardando assinatura",
  "Aguardando pagamento",
  "Aguardando Área Técnica",
];

async function buscarAtividades(): Promise<Atividade[]> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  if (!user) return [];

  const [{ data: processos }, { data: tagsEvento }, { data: processoTags }] = await Promise.all([
    supabase.from("processos").select("etapa_atual"),
    supabase.from("tags").select("id, valor").eq("categoria", "evento").eq("ativo", true).order("valor"),
    supabase.from("processo_tags").select("tag_id"),
  ]);

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

export default async function Atividades() {
  const atividades = await buscarAtividades();

  if (atividades.length === 0) return null;

  return (
    <>
      <div
        style={{
          fontSize: 10.5,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: 1,
          color: cor.textoTerciario,
          padding: "20px 12px 4px",
        }}
      >
        Atividades
      </div>
      {atividades.map((a) => (
        <Link
          key={a.label}
          href={a.href}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 12.5,
            fontWeight: 500,
            padding: "7px 12px",
            borderRadius: 10,
            color: cor.texto,
            textDecoration: "none",
          }}
        >
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: a.dot, flex: "none" }} />
          <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {a.label}
          </span>
          <span style={{ fontSize: 11.5, fontWeight: 600, color: cor.textoTerciario }}>{a.count}</span>
        </Link>
      ))}
    </>
  );
}
