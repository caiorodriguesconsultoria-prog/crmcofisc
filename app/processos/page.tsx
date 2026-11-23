import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import VisualizacoesProcessos from "./visualizacoes";
import { botaoPrimario, cor } from "@/lib/theme";
import Painel from "@/app/_ui/painel";
import BarraTopo from "@/app/_ui/barra-topo";
import CartaoColapsavel from "@/app/_ui/cartao-colapsavel";
import Atividades from "@/app/_nav/atividades";
import { getEtapasKanban, getPessoasAtivas, getTagsEvento } from "@/lib/dados-referencia";
import { statusContrato, gradienteOuSolido, type ParcelaStatus } from "@/lib/status-entrega";

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
    { data: andamentosAgendadosRaw },
    { data: pessoaAtual },
    { data: andamentosRaw },
    { data: execucoesPendentesRaw },
    { data: execucoesComLancamentosRaw },
  ] = await Promise.all([
    supabase
      .from("processos")
      .select(
        "id, numero_contrato, nup_principal, objeto, etapa_atual, situacao, prazo_data, coordenacao_id, coordenacoes(sigla), fornecedores(nome), forma_entrega_tag_id, titular_id, responsavel_atual_id, responsavel:pessoas!processos_responsavel_atual_id_fkey(nome), processo_eletronico_numero, processo_tags(tags(id, valor, cor)), relatorio_atualizado_em",
      )
      .order("created_at", { ascending: false }),
    supabase.from("coordenacoes").select("id, sigla").order("sigla"),
    supabase.from("tags").select("id, valor").eq("categoria", "forma_entrega").eq("ativo", true).order("valor"),
    getTagsEvento(),
    getPessoasAtivas(),
    getEtapasKanban(),
    supabase.from("processo_agendamentos").select("processo_id, data, horario").gte("data", hoje),
    // Antes só contava tarefa de origem "evento" — tarefa criada dentro do
    // grupo "Kanban" (origem_tipo "kanban") também pode ter data marcada e
    // ficava de fora do cálculo de "próximo evento" de cada contrato.
    supabase
      .from("processo_tarefas")
      .select("processo_id, agendamento_data")
      .eq("concluida", false)
      .not("agendamento_data", "is", null)
      .gte("agendamento_data", hoje),
    // Andamentos com data marcada — mesma lacuna já corrigida na Agenda
    // (app/agenda/page.tsx): não entravam nesse cálculo de jeito nenhum.
    supabase
      .from("andamentos")
      .select("processo_id, agendamento_data")
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
    // Pra cor do card por status de entrega (verde/amarelo/vermelho e o
    // degradê quando as parcelas estão em estados diferentes) — precisa de
    // TODAS as execuções com seus lançamentos, não só as atrasadas.
    supabase
      .from("processo_execucoes")
      .select(
        "processo_id, quantidade, data_prevista, processo_entrega_lancamentos(id, tipo, lancamento_pai_id, quantidade_normal, quantidade_avaria, quantidade_desvio, data_entrega)",
      ),
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
  for (const a of andamentosAgendadosRaw ?? []) {
    considerar(a.processo_id, a.agendamento_data as string, null);
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

  // Status de entrega por contrato (verde/amarelo/vermelho, ou degradê entre
  // eles quando as parcelas estão em estados diferentes) — pedido do Caio.
  // Ver lib/status-entrega.ts pra regra completa.
  const parcelasPorProcesso = new Map<string, ParcelaStatus[]>();
  for (const e of execucoesComLancamentosRaw ?? []) {
    const lista = parcelasPorProcesso.get(e.processo_id) ?? [];
    lista.push({
      quantidade: Number(e.quantidade),
      data_prevista: e.data_prevista,
      lancamentos: (e.processo_entrega_lancamentos ?? []).map((l: any) => ({
        id: l.id,
        tipo: l.tipo,
        lancamento_pai_id: l.lancamento_pai_id,
        quantidade_normal: Number(l.quantidade_normal),
        quantidade_avaria: Number(l.quantidade_avaria),
        quantidade_desvio: Number(l.quantidade_desvio),
        data_entrega: l.data_entrega,
      })),
    });
    parcelasPorProcesso.set(e.processo_id, lista);
  }
  const corStatusEntrega = { vermelho: cor.urgente, amarelo: cor.atencao, verde: cor.verdeEscuro };

  const processosComAgendamento = (processos ?? []).map((p) => ({
    ...p,
    proximoAgendamento: proximoAgendamentoPorProcesso.get(p.id) ?? null,
    ultimoAndamento: ultimoAndamentoPorProcesso.get(p.id) ?? null,
    entregaAtrasada: processosComEntregaAtrasada.has(p.id),
    relatorioDesatualizado: relatorioDesatualizado(p.relatorio_atualizado_em),
    corStatusEntrega: gradienteOuSolido(statusContrato(parcelasPorProcesso.get(p.id) ?? [], hoje), corStatusEntrega),
  }));

  const eventoSelecionado = sp.evento ? (eventos ?? []).find((e) => e.id === sp.evento) : null;
  const titulo = sp.etapa || eventoSelecionado?.valor || "Contratos";

  // Contadores da BarraTopo — reaproveitam o que esta página já buscou (sem
  // consulta nova): ativos vem do mesmo `processos`, agenda de hoje vem do
  // mesmo `agendamentosRaw` que a página já pedia pra calcular o próximo
  // agendamento de cada contrato.
  const contagemProcessosAtivos = (processos ?? []).filter((p) => p.situacao !== "concluido").length;
  const contagemAgendaHoje = (agendamentosRaw ?? []).filter((a) => a.data === hoje).length;
  const iniciaisUsuario = (user.email ?? "?")
    .split("@")[0]
    .split(/[._-]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join("") || "?";
  const atualizadoEm = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="crm-painel-fundo" style={{ flexDirection: "column", alignItems: "center" }}>
      <BarraTopo
        contagemProcessosAtivos={contagemProcessosAtivos}
        contagemAgendaHoje={contagemAgendaHoje}
        temAlerta={processosComEntregaAtrasada.size > 0}
        iniciaisUsuario={iniciaisUsuario}
        emailUsuario={user.email ?? undefined}
        atualizadoEm={atualizadoEm}
        migalha={titulo !== "Contratos" ? `Contratos > ${titulo}` : undefined}
      />

      <Painel
        titulo={titulo}
        subtitulo={titulo !== "Contratos" ? "Contratos" : undefined}
        maxWidth={1800}
        fundoAurora
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

        <div style={{ marginBottom: 16 }}>
          <CartaoColapsavel titulo="Atalhos por etapa e evento" abertoInicial={false}>
            <Suspense fallback={null}>
              <Atividades />
            </Suspense>
          </CartaoColapsavel>
        </div>

        <VisualizacoesProcessos
          processos={processosComAgendamento as any}
          coordenacoes={coordenacoes ?? []}
          formasEntrega={formasEntrega ?? []}
          eventos={eventos ?? []}
          responsaveis={responsaveis ?? []}
          etapas={etapas ?? []}
          minhaPessoaId={pessoaAtual?.id ?? null}
        />
      </Painel>

      <div className="crm-barra-topo-espaco-mobile" />
    </div>
  );
}
