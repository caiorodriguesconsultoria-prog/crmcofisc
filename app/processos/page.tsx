import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ListaProcessos from "./lista";
import { botaoPrimario, cor } from "@/lib/theme";
import Painel from "@/app/_ui/painel";
import { getEtapasKanban, getPessoasAtivas, getTagsEvento } from "@/lib/dados-referencia";

export default async function ProcessosPage({
  searchParams,
}: {
  searchParams: Promise<{ etapa?: string; evento?: string }>;
}) {
  const sp = await searchParams;
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
    { data: processos, error },
    { data: coordenacoes },
    { data: formasEntrega },
    eventos,
    responsaveis,
    etapas,
    { data: agendamentosRaw },
    { data: tarefasAgendadasRaw },
    { data: pessoaAtual },
    { data: andamentosRaw },
    { data: execucoesPendentesRaw },
  ] = await Promise.all([
    supabase
      .from("processos")
      .select(
        "id, numero_contrato, nup_principal, objeto, etapa_atual, situacao, coordenacao_id, coordenacoes(sigla), fornecedores(nome), forma_entrega_tag_id, titular_id, responsavel_atual_id, responsavel:pessoas!processos_responsavel_atual_id_fkey(nome), processo_eletronico_numero, processo_tags(tags(id, valor, cor)), relatorio_atualizado_em",
      )
      .order("created_at", { ascending: false }),
    supabase.from("coordenacoes").select("id, sigla").order("sigla"),
    supabase.from("tags").select("id, valor").eq("categoria", "forma_entrega").eq("ativo", true).order("valor"),
    getTagsEvento(),
    getPessoasAtivas(),
    getEtapasKanban(),
    supabase.from("processo_agendamentos").select("processo_id, data, horario").gte("data", hoje),
    supabase
      .from("processo_tarefas")
      .select("processo_id, agendamento_data")
      .eq("origem_tipo", "evento")
      .eq("concluida", false)
      .not("agendamento_data", "is", null)
      .gte("agendamento_data", hoje),
    supabase.from("pessoas").select("id").eq("auth_user_id", user.id).maybeSingle(),
    supabase
      .from("andamentos")
      .select("processo_id, texto, data")
      .neq("tipo", "Tarefa concluída")
      .order("data", { ascending: false }),
    supabase
      .from("processo_execucoes")
      .select("processo_id, data_prevista")
      .is("data_entrega", null)
      .not("data_prevista", "is", null)
      .lt("data_prevista", hoje),
  ]);

  // Agendamentos de entrega têm horário exato; tarefas são de dia inteiro
  // (sem horário) — entram depois de qualquer agendamento com hora marcada
  // no mesmo dia.
  function chaveOrdenacao(horario: string | null) {
    return horario ?? "23:59:59";
  }
  const proximoAgendamentoPorProcesso = new Map<
    string,
    { data: string; horario: string | null }
  >();
  function considerar(processoId: string, data: string, horario: string | null) {
    const atual = proximoAgendamentoPorProcesso.get(processoId);
    if (
      !atual ||
      data < atual.data ||
      (data === atual.data && chaveOrdenacao(horario) < chaveOrdenacao(atual.horario))
    ) {
      proximoAgendamentoPorProcesso.set(processoId, { data, horario });
    }
  }
  for (const a of agendamentosRaw ?? []) {
    considerar(a.processo_id, a.data, a.horario);
  }
  for (const t of tarefasAgendadasRaw ?? []) {
    considerar(t.processo_id, t.agendamento_data as string, null);
  }
  // Último andamento de cada contrato — andamentosRaw já vem ordenado por
  // data desc, então a primeira ocorrência de cada processo_id é a mais
  // recente.
  const ultimoAndamentoPorProcesso = new Map<string, string>();
  for (const a of andamentosRaw ?? []) {
    if (!ultimoAndamentoPorProcesso.has(a.processo_id)) {
      ultimoAndamentoPorProcesso.set(a.processo_id, a.texto);
    }
  }

  const processosComEntregaAtrasada = new Set((execucoesPendentesRaw ?? []).map((e) => e.processo_id));

  // Relatório "desatualizado" quando nunca foi marcado como atualizado ou
  // quando a última marcação já passou de 10 dias.
  const LIMITE_DIAS_RELATORIO = 10;
  const agora = Date.now();
  function relatorioDesatualizado(relatorioAtualizadoEm: string | null) {
    if (!relatorioAtualizadoEm) return true;
    const dias = (agora - new Date(relatorioAtualizadoEm).getTime()) / (1000 * 60 * 60 * 24);
    return dias > LIMITE_DIAS_RELATORIO;
  }

  const processosComAgendamento = (processos ?? []).map((p) => ({
    ...p,
    proximoAgendamento: proximoAgendamentoPorProcesso.get(p.id) ?? null,
    ultimoAndamento: ultimoAndamentoPorProcesso.get(p.id) ?? null,
    entregaAtrasada: processosComEntregaAtrasada.has(p.id),
    relatorioDesatualizado: relatorioDesatualizado(p.relatorio_atualizado_em),
  }));

  const eventoSelecionado = sp.evento ? (eventos ?? []).find((e) => e.id === sp.evento) : null;
  const titulo = sp.etapa || eventoSelecionado?.valor || "Contratos";

  return (
    <Painel
      titulo={titulo}
      subtitulo={titulo !== "Contratos" ? "Contratos" : undefined}
      voltarHref="/dashboard"
      maxWidth={1300}
      // <a> normal (não o <Link> do Next) de propósito — /processos/novo tem o
      // mesmo formato de URL que a rota interceptada do modal /processos/[id],
      // e navegação client-side acaba caindo no modal tratando "novo" como id.
      // Um <a> força navegação completa (recarrega a página), que resolve
      // certo pelo lado do servidor.
      acao={
        <a href="/processos/novo" style={{ ...botaoPrimario, textDecoration: "none" }}>
          + Novo contrato
        </a>
      }
    >
      {error && <p style={{ color: cor.urgente }}>Erro ao carregar: {error.message}</p>}

      <ListaProcessos
        processos={processosComAgendamento as any}
        coordenacoes={coordenacoes ?? []}
        formasEntrega={formasEntrega ?? []}
        eventos={eventos ?? []}
        responsaveis={responsaveis ?? []}
        etapas={etapas ?? []}
        minhaPessoaId={pessoaAtual?.id ?? null}
      />
    </Painel>
  );
}
