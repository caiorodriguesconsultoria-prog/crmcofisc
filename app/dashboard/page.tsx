import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PainelDashboard from "./painel-dashboard";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [
    { data: processos, error: erroProcessos },
    { data: kanbanAtivo, error: erroKanban },
    { count: eventosAtivos, error: erroEventos },
  ] = await Promise.all([
    supabase.from("processos").select("id, numero_contrato, etapa_atual"),
    supabase
      .from("processo_kanban_historico")
      .select("processo_id, entrada_em")
      .is("saida_em", null),
    supabase.from("processo_tags").select("*", { count: "exact", head: true }),
  ]);

  const erro = erroProcessos || erroKanban || erroEventos;

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
    <main style={{ padding: 32 }}>
      <h1 style={{ fontSize: 20 }}>CRM-COFISC</h1>
      <p>Logado como {user.email}</p>

      {erro && <p style={{ color: "#B0655C" }}>Erro ao carregar: {erro.message}</p>}

      <PainelDashboard
        processos={processosComTempo}
        contagemPorEtapa={contagemPorEtapa}
        eventosAtivos={eventosAtivos ?? 0}
      />

      <p style={{ marginTop: 24 }}>
        <Link href="/processos">Ver processos →</Link>
      </p>
      <p>
        <Link href="/fornecedores">Ver fornecedores →</Link>
      </p>
      <p>
        <Link href="/coordenacoes">Ver coordenações →</Link>
      </p>
      <form action="/logout" method="post">
        <button type="submit">Sair</button>
      </form>
    </main>
  );
}
