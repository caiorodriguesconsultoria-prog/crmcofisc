import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Board from "./board";
import { cor } from "@/lib/theme";
import Painel from "@/app/_ui/painel";

const KANBANS = [
  "Ofício de apresentação",
  "Aguardando entrega",
  "Aguardando assinatura",
  "Aguardando pagamento",
  "Aguardando Área Técnica",
];

function diasRestantes(prazoData: string | null) {
  if (!prazoData) return null;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const prazo = new Date(`${prazoData}T00:00:00`);
  return Math.round((prazo.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
}

export default async function KanbanPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  if (!user) {
    redirect("/login");
  }

  const { data: processos, error } = await supabase
    .from("processos")
    .select(
      "id, numero_contrato, nup_principal, objeto, etapa_atual, prazo_data, titular_id, responsavel_atual_id, coordenacoes(sigla), titular:pessoas!processos_titular_id_fkey(nome), responsavel:pessoas!processos_responsavel_atual_id_fkey(nome), processo_tags(tags(id, valor))",
    )
    .order("created_at", { ascending: false });

  const { data: kanbanAtivo } = await supabase
    .from("processo_kanban_historico")
    .select("id, processo_id")
    .is("saida_em", null);

  const hoje = new Date().toISOString().slice(0, 10);
  const { data: agendamentosRaw } = await supabase
    .from("processo_agendamentos")
    .select("processo_id, data, horario")
    .gte("data", hoje)
    .order("data")
    .order("horario");

  const agendamentosPorProcesso = new Map<string, { data: string; horario: string }[]>();
  for (const a of agendamentosRaw ?? []) {
    const lista = agendamentosPorProcesso.get(a.processo_id) ?? [];
    lista.push({ data: a.data, horario: a.horario });
    agendamentosPorProcesso.set(a.processo_id, lista);
  }

  const origemPorProcesso = new Map(
    (kanbanAtivo ?? []).map((k) => [k.processo_id, k.id]),
  );

  const origensAtivas = (kanbanAtivo ?? []).map((k) => k.id);

  const { data: tarefas } = await supabase
    .from("processo_tarefas")
    .select("origem_id, ordem, label, concluida")
    .eq("origem_tipo", "kanban")
    .in("origem_id", origensAtivas.length > 0 ? origensAtivas : ["00000000-0000-0000-0000-000000000000"])
    .order("ordem");

  const progressoPorOrigem = new Map<string, { total: number; concluidas: number }>();
  const proximaTarefaPorOrigem = new Map<string, string>();
  for (const t of tarefas ?? []) {
    const atual = progressoPorOrigem.get(t.origem_id) ?? { total: 0, concluidas: 0 };
    atual.total += 1;
    if (t.concluida) atual.concluidas += 1;
    else if (!proximaTarefaPorOrigem.has(t.origem_id)) proximaTarefaPorOrigem.set(t.origem_id, t.label);
    progressoPorOrigem.set(t.origem_id, atual);
  }

  const cards = (processos ?? []).map((p: any) => {
    const origemId = origemPorProcesso.get(p.id);
    const progresso = origemId ? progressoPorOrigem.get(origemId) : undefined;
    const dias = diasRestantes(p.prazo_data);
    const emCobertura = !!p.titular_id && p.responsavel_atual_id !== p.titular_id;
    const tags = (p.processo_tags ?? [])
      .map((pt: any) => pt.tags)
      .filter((t: any): t is { id: string; valor: string } => !!t);
    return {
      id: p.id,
      numeroContrato: p.numero_contrato,
      nup: p.nup_principal,
      objeto: p.objeto,
      etapaAtual: p.etapa_atual,
      coordenacaoSigla: p.coordenacoes?.sigla ?? "",
      prazoData: p.prazo_data,
      dias,
      aguardando: origemId ? proximaTarefaPorOrigem.get(origemId) ?? null : null,
      emCobertura,
      nomeExibido: emCobertura ? p.responsavel?.nome ?? "" : p.titular?.nome ?? "",
      tarefasTotal: progresso?.total ?? 0,
      tarefasConcluidas: progresso?.concluidas ?? 0,
      tags,
      agendamentos: agendamentosPorProcesso.get(p.id) ?? [],
    };
  });

  const colunas = KANBANS.map((nome) => ({
    nome,
    cards: cards.filter((c) => c.etapaAtual === nome),
  }));

  return (
    <Painel titulo="Kanban" voltarHref="/dashboard" maxWidth={1400}>
      {error && <p style={{ color: cor.urgente }}>Erro ao carregar: {error.message}</p>}

      <Board colunas={colunas} kanbans={KANBANS} />
    </Painel>
  );
}
