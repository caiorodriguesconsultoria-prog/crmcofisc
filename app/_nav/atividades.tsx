import { cor } from "@/lib/theme";
import { corEvento } from "@/lib/cores-evento";
import { createClient } from "@/lib/supabase/server";
import { getTagsEvento } from "@/lib/dados-referencia";
import GruposAtividades from "./grupos-atividades";
import type { Atividade } from "./sidebar";

const KANBAN_DOT = cor.positivo;

const KANBANS = [
  "Ofício de apresentação",
  "Aguardando entrega",
  "Aguardando assinatura",
  "Aguardando pagamento",
  "Aguardando Área Técnica",
];

export default async function Atividades() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  if (!user) return null;

  const [{ data: processos }, tagsEvento, { data: processoTags }] = await Promise.all([
    supabase.from("processos").select("etapa_atual"),
    getTagsEvento(),
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
    dot: corEvento(t.id).texto,
  }));

  if (atividadesKanban.length === 0 && atividadesEvento.length === 0) return null;

  return <GruposAtividades atividades={atividadesKanban} eventos={atividadesEvento} />;
}
