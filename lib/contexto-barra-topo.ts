import type { SupabaseClient } from "@supabase/supabase-js";

// Dado repetido em toda tela que já migrou pra BarraTopo (Etapas 2, 3, 5 do
// redesenho, e agora as telas restantes) — centralizado aqui pra não
// duplicar a mesma consulta de contagem e o mesmo cálculo de iniciais em
// cada page.tsx. Os dois números são os mesmos que o Painel já calculava
// (ativos e compromissos de hoje), não uma métrica nova.
export async function getContextoBarraTopo(supabase: SupabaseClient, email: string | null) {
  const hoje = new Date().toISOString().slice(0, 10);

  const [{ count: contagemProcessosAtivos }, { data: agendamentosHoje }] = await Promise.all([
    supabase.from("processos").select("id", { count: "exact", head: true }).is("conclusao_tipo", null),
    supabase.from("processo_agendamentos").select("id").eq("data", hoje),
  ]);

  const iniciaisUsuario =
    (email ?? "?")
      .split("@")[0]
      .split(/[._-]/)
      .filter(Boolean)
      .slice(0, 2)
      .map((parte) => parte[0]?.toUpperCase())
      .join("") || "?";

  const atualizadoEm = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  return {
    contagemProcessosAtivos: contagemProcessosAtivos ?? 0,
    contagemAgendaHoje: (agendamentosHoje ?? []).length,
    iniciaisUsuario,
    atualizadoEm,
  };
}
