import { cor } from "@/lib/theme";
import { corEvento } from "@/lib/cores-evento";
import { createClient } from "@/lib/supabase/server";
import { getTagsEvento, getEtapasKanban } from "@/lib/dados-referencia";
import GruposAtividades from "./grupos-atividades";
import type { Atividade } from "./sidebar";

const KANBAN_DOT = cor.positivo;

export default async function Atividades() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  if (!user) return null;

  const [{ data: processos }, tagsEvento, etapas, { data: processoTags }, { data: pessoa }] = await Promise.all([
    supabase.from("processos").select("etapa_atual"),
    getTagsEvento(),
    getEtapasKanban(),
    supabase.from("processo_tags").select("tag_id"),
    supabase.from("pessoas").select("is_admin").eq("auth_user_id", user.id).maybeSingle(),
  ]);
  const ehAdmin = !!pessoa?.is_admin;

  const porEtapa = new Map<string, number>();
  for (const p of processos ?? []) {
    porEtapa.set(p.etapa_atual, (porEtapa.get(p.etapa_atual) ?? 0) + 1);
  }

  const porTag = new Map<string, number>();
  for (const t of processoTags ?? []) {
    porTag.set(t.tag_id, (porTag.get(t.tag_id) ?? 0) + 1);
  }

  const atividadesKanban: Atividade[] = (etapas ?? []).map((e) => ({
    label: e.nome,
    count: porEtapa.get(e.nome) ?? 0,
    href: `/processos?etapa=${encodeURIComponent(e.nome)}`,
    dot: KANBAN_DOT,
  }));

  const atividadesEvento: Atividade[] = (tagsEvento ?? [])
    .slice()
    .sort((a, b) => a.valor.localeCompare(b.valor, "pt-BR"))
    .map((t) => ({
      id: t.id,
      label: t.valor,
      count: porTag.get(t.id) ?? 0,
      href: `/processos?evento=${t.id}`,
      dot: corEvento(t.id, t.cor).texto,
    }));

  if (atividadesKanban.length === 0 && atividadesEvento.length === 0) return null;

  return <GruposAtividades atividades={atividadesKanban} eventos={atividadesEvento} ehAdmin={ehAdmin} />;
}
