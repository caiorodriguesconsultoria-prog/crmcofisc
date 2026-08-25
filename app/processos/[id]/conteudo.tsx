import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PainelProcesso from "./painel";
import Andamentos from "./andamentos";
import Cobertura from "./cobertura";
import Checklist from "./checklist";
import GestaoFiscalizacao from "./gestao-fiscalizacao";
import DadosPrincipais from "./dados-principais";
import DadosProcesso from "./dados-processo";
import Agendamentos from "./agendamentos";
import Cronograma from "./cronograma";
import Conclusao from "./conclusao";
import Abas from "./abas";
import QuadroResumitivo from "./relatorio/quadro-resumitivo";
import CronogramaRelatorio from "./relatorio/cronograma-relatorio";
import PautaDistribuicao from "./relatorio/pauta-distribuicao";
import EntregasLazy from "./entregas-lazy";
import HistoricoLazy from "./historico-lazy";
import Ocorrencias from "./relatorio/ocorrencias";
import { card, cor, pill } from "@/lib/theme";
import TituloDestaque from "@/app/_ui/titulo";
import { BotaoCopiar } from "@/app/_ui/campo";
import CartaoColapsavel from "@/app/_ui/cartao-colapsavel";
import { getPessoasAtivas, getPapeisGestorFiscal, getTagsEvento } from "@/lib/dados-referencia";

function diasRestantes(prazoData: string | null) {
  if (!prazoData) return null;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const prazo = new Date(`${prazoData}T00:00:00`);
  return Math.round((prazo.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
}

function corPrazo(dias: number | null) {
  if (dias === null) return null;
  if (dias <= 0) return cor.urgente;
  if (dias <= 7) return cor.atencao;
  return cor.positivo;
}

function textoPrazo(dias: number | null) {
  if (dias === null) return null;
  if (dias < 0) return "vencido";
  if (dias === 0) return "hoje";
  return `em ${dias} dias`;
}

function formatarData(data: string | null) {
  return data ? new Date(`${data}T00:00:00`).toLocaleDateString("pt-BR") : "";
}

const rotuloSecao: React.CSSProperties = {
  fontSize: 11.5,
  fontWeight: 600,
  color: cor.destaque,
  letterSpacing: 0.6,
  textTransform: "uppercase",
};

// Compartilhado entre a tela cheia (/processos/[id]) e a versão em modal
// (rota interceptada @modal), pra buscar os dados uma única vez e só variar
// o wrapper visual (painel de página vs. modal flutuante).
export async function carregarProcesso(id: string) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  if (!user) {
    redirect("/login");
  }

  const { data: processo, error: erroProcesso } = await supabase
    .from("processos")
    .select(
      "id, numero_contrato, nup_principal, objeto, etapa_atual, motivo_backup, coordenacao_id, prazo_data, quantidade_contratada, data_assinatura, vigencia_inicio, vigencia_fim, processo_eletronico_numero, pregao_eletronico_numero, ata_registro_precos_numero, publicacao_dou, publicacao_pncp, valor_unitario, valor_global, valor_garantia, portaria_designacao_fiscal, nota_empenho_numero, programa_trabalho, natureza_despesa, local_entrega, conclusao_tipo, conclusao_checks, conclusao_texto, conclusao_penalidade, coordenacoes(sigla), fornecedores(nome, cnpj), titular:pessoas!processos_titular_id_fkey(id, nome), responsavel:pessoas!processos_responsavel_atual_id_fkey(id, nome), gestor:pessoas!processos_gestor_id_fkey(id, nome, matricula), gestor_substituto:pessoas!processos_gestor_substituto_id_fkey(id, nome, matricula), fiscal:pessoas!processos_fiscal_id_fkey(id, nome, matricula), fiscal_substituto:pessoas!processos_fiscal_substituto_id_fkey(id, nome, matricula)",
    )
    .eq("id", id)
    .single();

  if (erroProcesso || !processo) {
    notFound();
  }

  const p = processo as any;

  const [
    { data: tagsAtivasRaw },
    tagsDisponiveis,
    { data: andamentosRaw },
    { data: pessoaAtual },
    pessoas,
    papeis,
    { data: nups },
    { data: execucoes },
    { data: pauta },
    { data: agendamentos },
    { data: kanbanAtivo },
    { data: tagHistoricoAtivo },
  ] = await Promise.all([
    supabase.from("processo_tags").select("tag_id, tags(id, valor)").eq("processo_id", id),
    getTagsEvento(),
    supabase
      .from("andamentos")
      .select("id, tipo, texto, data, sei_numero, incluir_relatorio, autor:pessoas(nome)")
      .eq("processo_id", id)
      .order("data", { ascending: false }),
    supabase.from("pessoas").select("id").eq("auth_user_id", user.id).maybeSingle(),
    getPessoasAtivas(),
    getPapeisGestorFiscal(),
    supabase
      .from("processo_nups")
      .select("id, tipo, nup")
      .eq("processo_id", id)
      .in("tipo", ["relatorio", "pagamento"]),
    supabase
      .from("processo_execucoes")
      .select("id, numero, quantidade, unidade, data_prevista, data_entrega, situacao")
      .eq("processo_id", id)
      .order("numero"),
    supabase
      .from("processo_pauta_distribuicao")
      .select("id, uf, quantidade")
      .eq("processo_id", id)
      .order("created_at"),
    supabase
      .from("processo_agendamentos")
      .select("id, data, horario, observacao, google_event_id")
      .eq("processo_id", id)
      .order("data")
      .order("horario"),
    supabase
      .from("processo_kanban_historico")
      .select("id")
      .eq("processo_id", id)
      .is("saida_em", null)
      .maybeSingle(),
    supabase
      .from("processo_tag_historico")
      .select("id, tags(valor)")
      .eq("processo_id", id)
      .is("fim_em", null),
  ]);

  const tagsAtivas = (tagsAtivasRaw ?? []).map((t: any) => ({
    id: t.tag_id,
    valor: t.tags?.valor ?? "",
  }));

  const nupRelatorioRow = (nups ?? []).find((n) => n.tipo === "relatorio");
  const nupPagamentoRow = (nups ?? []).find((n) => n.tipo === "pagamento");
  const nupRelatorio = nupRelatorioRow
    ? { id: nupRelatorioRow.id, tipo: "relatorio" as const, valor: nupRelatorioRow.nup }
    : null;
  const nupPagamento = nupPagamentoRow
    ? { id: nupPagamentoRow.id, tipo: "pagamento" as const, valor: nupPagamentoRow.nup }
    : null;

  const todosGestores = (papeis ?? [])
    .filter((pp) => pp.papel === "gestor")
    .map((pp: any) => ({ id: pp.pessoa_id, nome: pp.pessoas?.nome ?? "" }));
  const todosFiscais = (papeis ?? [])
    .filter((pp) => pp.papel === "fiscal")
    .map((pp: any) => ({ id: pp.pessoa_id, nome: pp.pessoas?.nome ?? "" }));

  const origensAtivas = [
    ...(kanbanAtivo ? [kanbanAtivo.id] : []),
    ...(tagHistoricoAtivo ?? []).map((t) => t.id),
  ];

  const nomeOrigem = new Map<string, string>();
  if (kanbanAtivo) nomeOrigem.set(kanbanAtivo.id, p.etapa_atual);
  for (const t of tagHistoricoAtivo ?? []) {
    nomeOrigem.set(t.id, (t as any).tags?.valor ?? "Evento");
  }

  const { data: tarefasRaw } = await supabase
    .from("processo_tarefas")
    .select("id, origem_tipo, origem_id, ordem, label, concluida, agendamento_data, agendamento_horario, google_event_id")
    .eq("processo_id", id)
    .in("origem_id", origensAtivas.length > 0 ? origensAtivas : ["00000000-0000-0000-0000-000000000000"])
    .order("ordem");

  type TarefaGrupo = {
    id: string;
    label: string;
    concluida: boolean;
    agendamentoData: string | null;
    agendamentoHorario: string | null;
    googleEventId: string | null;
  };

  const gruposTarefas = Array.from(
    (tarefasRaw ?? []).reduce((acc, t) => {
      const grupo = acc.get(t.origem_id) ?? {
        origemId: t.origem_id,
        origemTipo: t.origem_tipo,
        nome: nomeOrigem.get(t.origem_id) ?? t.origem_tipo,
        tarefas: [] as TarefaGrupo[],
      };
      grupo.tarefas.push({
        id: t.id,
        label: t.label,
        concluida: t.concluida,
        agendamentoData: t.agendamento_data,
        agendamentoHorario: t.agendamento_horario,
        googleEventId: t.google_event_id,
      });
      acc.set(t.origem_id, grupo);
      return acc;
    }, new Map<string, { origemId: string; origemTipo: string; nome: string; tarefas: TarefaGrupo[] }>()).values(),
  );

  const secao: React.CSSProperties = { ...card, marginTop: 16 };

  const grupoKanban = gruposTarefas.find((g) => g.origemTipo === "kanban");
  const aguardando = grupoKanban?.tarefas.find((t) => !t.concluida)?.label ?? null;

  // Data mostrada no topo: a mais próxima que ainda vai acontecer, entre o
  // prazo do contrato, os agendamentos de entrega, as tarefas de evento com
  // data marcada (não concluídas) e as execuções ainda não entregues — não
  // só o prazo_data isolado, que pode já estar vencido enquanto existe algo
  // real se aproximando.
  const candidatosData: (string | null)[] = [
    p.prazo_data,
    ...(agendamentos ?? []).map((a: any) => a.data as string),
    ...(tarefasRaw ?? [])
      .filter((t: any) => t.agendamento_data && !t.concluida)
      .map((t: any) => t.agendamento_data as string),
    ...(execucoes ?? [])
      .filter((e: any) => e.data_prevista && !e.data_entrega)
      .map((e: any) => e.data_prevista as string),
  ];
  const proximasData = candidatosData
    .map((data) => ({ data, dias: diasRestantes(data) }))
    .filter((c): c is { data: string; dias: number } => c.data !== null && c.dias !== null && c.dias >= 0)
    .sort((a, b) => a.dias - b.dias);
  const dataExibida = proximasData[0]?.data ?? p.prazo_data;
  const dias = diasRestantes(dataExibida);
  const dot = corPrazo(dias);
  const emCobertura = !!p.titular && p.responsavel?.id !== p.titular?.id;
  const formaEntrega = pauta && pauta.length > 1 ? "Descentralizada" : pauta && pauta.length === 1 ? "Centralizada" : "não definida";

  const andamentosIncluidos = (andamentosRaw ?? []).filter((a: any) => a.incluir_relatorio);

  const conteudoProcesso = (
    <div>
      <DadosPrincipais
        processoId={p.id}
        nupPrincipal={p.nup_principal}
        nupRelatorio={nupRelatorio}
        nupPagamento={nupPagamento}
        fornecedorNome={p.fornecedores?.nome ?? ""}
        cnpj={p.fornecedores?.cnpj ?? ""}
        objeto={p.objeto}
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 16,
          marginTop: 16,
        }}
      >
        <DadosProcesso
          quantidadeContratada={p.quantidade_contratada}
          numeroExecucoes={(execucoes ?? []).length}
          dataAssinatura={p.data_assinatura}
          vigenciaInicio={p.vigencia_inicio}
          vigenciaFim={p.vigencia_fim}
          formaEntrega={formaEntrega}
          naturezaDespesa={p.natureza_despesa}
          valorGlobal={p.valor_global}
        />
      </div>

      {/* Kanban + Eventos ativos + Agendamentos de entrega — fixo, sem recolher */}
      <div style={secao}>
        <PainelProcesso
          processoId={p.id}
          etapaAtual={p.etapa_atual}
          tagsAtivas={tagsAtivas}
          tagsDisponiveis={tagsDisponiveis ?? []}
        />
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${cor.borda}` }}>
          <Agendamentos
            processoId={p.id}
            numeroContrato={p.numero_contrato}
            agendamentos={(agendamentos ?? []).map((a: any) => ({
              id: a.id,
              data: a.data,
              horario: a.horario,
              observacao: a.observacao,
              googleEventId: a.google_event_id,
            }))}
          />
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <CartaoColapsavel titulo="Checklist" abertoInicial={false}>
          <Checklist
            processoId={p.id}
            autorId={pessoaAtual?.id ?? null}
            numeroContrato={p.numero_contrato}
            grupos={gruposTarefas}
          />
        </CartaoColapsavel>
      </div>

      <div style={{ marginTop: 16 }}>
        <GestaoFiscalizacao
          processoId={p.id}
          gestor={p.gestor}
          gestorSubstituto={p.gestor_substituto}
          fiscal={p.fiscal}
          fiscalSubstituto={p.fiscal_substituto}
          gestores={todosGestores}
          fiscais={todosFiscais}
        />
      </div>

      <div style={{ marginTop: 16 }}>
        <CartaoColapsavel titulo="Cronograma de entregas" abertoInicial={false}>
          <Cronograma processoId={p.id} execucoes={(execucoes ?? []) as any} />
        </CartaoColapsavel>
      </div>

      <div style={{ marginTop: 16 }}>
        <CartaoColapsavel titulo="Andamentos" abertoInicial={false}>
          <Andamentos
            processoId={p.id}
            autorId={pessoaAtual?.id ?? null}
            numeroContrato={p.numero_contrato}
            andamentos={(andamentosRaw ?? []) as any}
          />
        </CartaoColapsavel>
      </div>

      <div style={{ marginTop: 16 }}>
        <CartaoColapsavel titulo="Responsável" abertoInicial={false}>
          <Cobertura
            processoId={p.id}
            titular={p.titular}
            responsavelAtual={p.responsavel}
            motivoBackup={p.motivo_backup}
            pessoas={pessoas ?? []}
          />
        </CartaoColapsavel>
      </div>

      <div style={{ marginTop: 16 }}>
        <CartaoColapsavel titulo="Histórico" abertoInicial={false}>
          <HistoricoLazy processoId={p.id} />
        </CartaoColapsavel>
      </div>
    </div>
  );

  const conteudoRelatorio = (
    <div>
      <p style={{ margin: "0 0 16px" }}>
        <Link href={`/processos/${id}/relatorio/pdf`}>Exportar PDF →</Link>
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={card}>
          <span style={rotuloSecao}>1. Quadro resumitivo</span>
          <QuadroResumitivo processoId={id} processo={p} />
        </div>

        <div style={card}>
          <span style={rotuloSecao}>3. Cronograma de entrega</span>
          <CronogramaRelatorio execucoes={(execucoes ?? []) as any} />
        </div>

        <div style={card}>
          <span style={rotuloSecao}>4. Execução do contrato</span>
          <PautaDistribuicao processoId={id} pauta={(pauta ?? []) as any} />
          <EntregasLazy processoId={id} />
        </div>

        <div style={card}>
          <span style={rotuloSecao}>5. Ocorrências</span>
          <Ocorrencias andamentos={andamentosIncluidos as any} />
        </div>

        <div style={card}>
          <span style={rotuloSecao}>8. Conclusões</span>
          <Conclusao
            processoId={p.id}
            numeroContrato={p.numero_contrato}
            conclusao={{
              tipo: p.conclusao_tipo,
              checks: p.conclusao_checks,
              texto: p.conclusao_texto,
              penalidade: p.conclusao_penalidade,
            }}
          />
        </div>
      </div>
    </div>
  );

  const topo = (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <TituloDestaque fontSize={19}>{p.numero_contrato}</TituloDestaque>
        <span style={{ ...pill, background: cor.destaqueFundo, color: cor.destaque }}>{p.etapa_atual}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
        <span style={{ fontSize: 12, color: cor.textoTerciario }}>{p.nup_principal}</span>
        <BotaoCopiar texto={p.nup_principal} />
      </div>
      {emCobertura && (
        <p style={{ fontSize: 11.5, color: cor.destaque, margin: "4px 0 0" }}>
          Cobertura de férias · {p.responsavel?.nome}
        </p>
      )}
      {dias !== null && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, fontSize: 11.5, fontWeight: 600, color: dot ?? undefined }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: dot ?? undefined, flex: "none" }} />
          {formatarData(dataExibida)} · {textoPrazo(dias)}
          {aguardando && <span style={{ color: cor.textoSecundario, fontWeight: 400 }}>· Aguarda: {aguardando}</span>}
        </div>
      )}
    </div>
  );

  const corpo = <Abas processo={conteudoProcesso} relatorio={conteudoRelatorio} />;

  return { topo, corpo };
}
