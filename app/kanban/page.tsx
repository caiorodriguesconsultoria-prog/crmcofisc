import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Board from "./board";
import { cor } from "@/lib/theme";

const KANBANS = [
  "Ofício de apresentação",
  "Aguardando entrega",
  "Aguardando assinatura",
  "Aguardando pagamento",
  "Aguardando Área Técnica",
];

export default async function KanbanPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: processos, error } = await supabase
    .from("processos")
    .select("id, numero_contrato, etapa_atual, coordenacoes(sigla), fornecedores(nome)")
    .order("created_at", { ascending: false });

  const { data: kanbanAtivo } = await supabase
    .from("processo_kanban_historico")
    .select("id, processo_id")
    .is("saida_em", null);

  const origemPorProcesso = new Map(
    (kanbanAtivo ?? []).map((k) => [k.processo_id, k.id]),
  );

  const origensAtivas = (kanbanAtivo ?? []).map((k) => k.id);

  const { data: tarefas } = await supabase
    .from("processo_tarefas")
    .select("origem_id, concluida")
    .eq("origem_tipo", "kanban")
    .in("origem_id", origensAtivas.length > 0 ? origensAtivas : ["00000000-0000-0000-0000-000000000000"]);

  const progressoPorOrigem = new Map<string, { total: number; concluidas: number }>();
  for (const t of tarefas ?? []) {
    const atual = progressoPorOrigem.get(t.origem_id) ?? { total: 0, concluidas: 0 };
    atual.total += 1;
    if (t.concluida) atual.concluidas += 1;
    progressoPorOrigem.set(t.origem_id, atual);
  }

  const cards = (processos ?? []).map((p: any) => {
    const origemId = origemPorProcesso.get(p.id);
    const progresso = origemId ? progressoPorOrigem.get(origemId) : undefined;
    return {
      id: p.id,
      numeroContrato: p.numero_contrato,
      etapaAtual: p.etapa_atual,
      coordenacaoSigla: p.coordenacoes?.sigla ?? "",
      fornecedorNome: p.fornecedores?.nome ?? "",
      tarefasTotal: progresso?.total ?? 0,
      tarefasConcluidas: progresso?.concluidas ?? 0,
    };
  });

  const colunas = KANBANS.map((nome) => ({
    nome,
    cards: cards.filter((c) => c.etapaAtual === nome),
  }));

  return (
    <main style={{ padding: 32 }}>
      <h1 style={{ fontSize: 20 }}>Kanban</h1>

      {error && <p style={{ color: cor.urgente }}>Erro ao carregar: {error.message}</p>}

      <Board colunas={colunas} kanbans={KANBANS} />
    </main>
  );
}
