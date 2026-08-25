import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PainelDashboard from "./painel-dashboard";
import { cor } from "@/lib/theme";
import Painel from "@/app/_ui/painel";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  if (!user) {
    redirect("/login");
  }

  const [
    { data: processos, error: erroProcessos },
    { data: kanbanAtivo, error: erroKanban },
  ] = await Promise.all([
    supabase.from("processos").select("id, numero_contrato, etapa_atual, prazo_data, conclusao_tipo"),
    supabase
      .from("processo_kanban_historico")
      .select("processo_id, entrada_em")
      .is("saida_em", null),
  ]);

  const erro = erroProcessos || erroKanban;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const hojeTime = hoje.getTime();

  const ativos = (processos ?? []).filter((p) => !p.conclusao_tipo).length;
  const concluidos = (processos ?? []).filter((p) => p.conclusao_tipo).length;
  const vencendoHoje = (processos ?? []).filter(
    (p) => p.prazo_data && new Date(`${p.prazo_data}T00:00:00`).getTime() === hojeTime,
  ).length;

  const entradaPorProcesso = new Map(
    (kanbanAtivo ?? []).map((k) => [k.processo_id, k.entrada_em]),
  );

  const processosComTempo = (processos ?? []).map((p) => {
    const entrada = entradaPorProcesso.get(p.id);
    const diasParado = entrada
      ? Math.floor((Date.now() - new Date(entrada).getTime()) / (1000 * 60 * 60 * 24))
      : null;
    return {
      id: p.id,
      numeroContrato: p.numero_contrato,
      etapaAtual: p.etapa_atual,
      diasParado,
    };
  });

  const contagemPorEtapa: Record<string, number> = {};
  for (const p of processosComTempo) {
    contagemPorEtapa[p.etapaAtual] = (contagemPorEtapa[p.etapaAtual] ?? 0) + 1;
  }

  return (
    <Painel titulo="Painel" subtitulo={`Logado como ${user.email}`} maxWidth={900}>
      {erro && <p style={{ color: cor.urgente }}>Erro ao carregar: {erro.message}</p>}

      <PainelDashboard
        processos={processosComTempo}
        contagemPorEtapa={contagemPorEtapa}
        ativos={ativos}
        concluidos={concluidos}
        vencendoHoje={vencendoHoje}
      />
    </Painel>
  );
}
