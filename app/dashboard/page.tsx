import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PainelDashboard from "./painel-dashboard";
import { cor } from "@/lib/theme";
import Painel from "@/app/_ui/painel";
import { getTagsEvento, getEtapasKanban } from "@/lib/dados-referencia";
import { numeroContratoSemSei } from "@/lib/numero-contrato";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  if (!user) {
    redirect("/login");
  }

  const hoje = new Date().toISOString().slice(0, 10);

  const [
    { data: processos, error: erroProcessos },
    { data: kanbanAtivo, error: erroKanban },
    { data: tagHistoricoAtivo },
    { data: agendamentosHoje },
    { data: andamentosHoje },
    { data: tarefasHoje },
    eventos,
    etapas,
  ] = await Promise.all([
    supabase
      .from("processos")
      .select(
        "id, numero_contrato, nup_principal, objeto, etapa_atual, prazo_data, conclusao_tipo, titular_id, responsavel_atual_id, processo_tags(tags(id, valor, cor))",
      ),
    supabase.from("processo_kanban_historico").select("id, processo_id, entrada_em").is("saida_em", null),
    supabase.from("processo_tag_historico").select("id, processo_id").is("fim_em", null),
    supabase.from("processo_agendamentos").select("processo_id, horario").eq("data", hoje),
    supabase
      .from("andamentos")
      .select("processo_id, texto, agendamento_horario")
      .eq("agendamento_data", hoje),
    supabase
      .from("processo_tarefas")
      .select("origem_tipo, origem_id, label, periodo")
      .eq("concluida", false)
      .eq("agendamento_data", hoje),
    getTagsEvento(),
    getEtapasKanban(),
  ]);

  const erro = erroProcessos || erroKanban;

  const hojeMeiaNoite = new Date();
  hojeMeiaNoite.setHours(0, 0, 0, 0);
  const hojeTime = hojeMeiaNoite.getTime();

  const ativos = (processos ?? []).filter((p) => !p.conclusao_tipo).length;
  const concluidos = (processos ?? []).filter((p) => p.conclusao_tipo).length;
  const vencendoHoje = (processos ?? []).filter(
    (p) => p.prazo_data && new Date(`${p.prazo_data}T00:00:00`).getTime() === hojeTime,
  ).length;
  const emCoberturaFerias = (processos ?? []).filter(
    (p) => p.titular_id && p.responsavel_atual_id && p.titular_id !== p.responsavel_atual_id,
  ).length;

  const entradaPorProcesso = new Map((kanbanAtivo ?? []).map((k) => [k.processo_id, k.entrada_em]));

  const processosComTempo = (processos ?? []).map((p) => {
    const entrada = entradaPorProcesso.get(p.id);
    const diasParado = entrada
      ? Math.floor((Date.now() - new Date(entrada).getTime()) / (1000 * 60 * 60 * 24))
      : null;
    return {
      id: p.id,
      numeroContrato: numeroContratoSemSei(p.numero_contrato),
      etapaAtual: p.etapa_atual,
      diasParado,
    };
  });

  const contagemPorEtapa: Record<string, number> = {};
  for (const p of processosComTempo) {
    contagemPorEtapa[p.etapaAtual] = (contagemPorEtapa[p.etapaAtual] ?? 0) + 1;
  }

  // Quantos processos estão COM cada evento agora (tags ativas hoje, não
  // histórico) — atualiza sozinho conforme os processos são movimentados.
  // O histórico (já teve alguma vez) é uma métrica diferente, que fica só
  // na aba Dados.
  const contagemPorEvento: Record<string, number> = {};
  for (const p of processos ?? []) {
    for (const pt of p.processo_tags ?? []) {
      const tagId = (pt as any).tags?.id;
      if (!tagId) continue;
      contagemPorEvento[tagId] = (contagemPorEvento[tagId] ?? 0) + 1;
    }
  }

  // Atividade de hoje: processo_id de origem_id resolvido via kanban/tag
  // ativos (mesmo mecanismo do Kanban), unificado com agendamentos e
  // andamentos com data marcada pra hoje.
  const processoIdPorOrigemKanban = new Map((kanbanAtivo ?? []).map((k) => [k.id, k.processo_id]));
  const processoIdPorOrigemTag = new Map((tagHistoricoAtivo ?? []).map((t) => [t.id, t.processo_id]));

  type ItemAtividade = { rotulo: string; horario: string | null; periodo?: "manha" | "tarde" | null };
  // Pra ordenar a lista: agendamento tem hora exata, tarefa só tem período —
  // período vira um horário fictício só pra decidir a ordem de exibição.
  function chaveOrdenacaoItem(item: ItemAtividade) {
    if (item.horario) return item.horario;
    if (item.periodo === "manha") return "08:00";
    if (item.periodo === "tarde") return "14:00";
    return "23:59";
  }
  const atividadePorProcesso = new Map<string, ItemAtividade[]>();
  function adicionar(processoId: string | undefined, item: ItemAtividade) {
    if (!processoId) return;
    const lista = atividadePorProcesso.get(processoId) ?? [];
    lista.push(item);
    atividadePorProcesso.set(processoId, lista);
  }

  for (const a of agendamentosHoje ?? []) {
    adicionar(a.processo_id, { rotulo: "Agendamento de entrega", horario: a.horario });
  }
  for (const a of andamentosHoje ?? []) {
    adicionar(a.processo_id, { rotulo: a.texto, horario: a.agendamento_horario });
  }
  for (const t of tarefasHoje ?? []) {
    const processoId =
      t.origem_tipo === "kanban"
        ? processoIdPorOrigemKanban.get(t.origem_id)
        : processoIdPorOrigemTag.get(t.origem_id);
    adicionar(processoId, { rotulo: t.label, horario: null, periodo: t.periodo as "manha" | "tarde" | null });
  }

  const processosAtividadeHoje = (processos ?? [])
    .filter((p) => atividadePorProcesso.has(p.id))
    .map((p) => ({
      id: p.id,
      numeroContrato: numeroContratoSemSei(p.numero_contrato),
      nup: p.nup_principal,
      objeto: p.objeto,
      etapaAtual: p.etapa_atual,
      tags: (p.processo_tags ?? [])
        .map((pt: any) => pt.tags)
        .filter((t: any): t is { id: string; valor: string; cor: string | null } => !!t),
      itens: (atividadePorProcesso.get(p.id) ?? []).sort((a, b) =>
        chaveOrdenacaoItem(a).localeCompare(chaveOrdenacaoItem(b)),
      ),
    }));

  return (
    <Painel titulo="Painel" subtitulo={`Logado como ${user.email}`} maxWidth={1100}>
      {erro && <p style={{ color: cor.urgente }}>Erro ao carregar: {erro.message}</p>}

      <PainelDashboard
        processos={processosComTempo}
        contagemPorEtapa={contagemPorEtapa}
        contagemPorEvento={contagemPorEvento}
        ativos={ativos}
        concluidos={concluidos}
        vencendoHoje={vencendoHoje}
        emCoberturaFerias={emCoberturaFerias}
        processosAtividadeHoje={processosAtividadeHoje}
        eventos={eventos ?? []}
        etapas={etapas ?? []}
      />
    </Painel>
  );
}
