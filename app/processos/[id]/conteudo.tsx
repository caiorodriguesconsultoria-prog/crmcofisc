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
import Prazo from "./prazo";
import Agendamentos from "./agendamentos";
import Cronograma from "./cronograma";
import Conclusao from "./conclusao";
import Abas from "./abas";
import QuadroResumitivo from "./relatorio/quadro-resumitivo";
import CronogramaRelatorio from "./relatorio/cronograma-relatorio";
import PautaDistribuicao from "./relatorio/pauta-distribuicao";
import EntregasLazy from "./entregas-lazy";
import Ocorrencias from "./relatorio/ocorrencias";
import ConclusaoRelatorio from "./relatorio/conclusao-relatorio";
import { card, cor, pill } from "@/lib/theme";
import TituloDestaque from "@/app/_ui/titulo";
import { BotaoCopiar } from "@/app/_ui/campo";
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
    { data: kanbanHistorico },
    { data: tagHistorico },
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
      .from("processo_kanban_historico")
      .select("kanban, entrada_em, saida_em, duracao")
      .eq("processo_id", id)
      .order("entrada_em", { ascending: false }),
    supabase
      .from("processo_tag_historico")
      .select("inicio_em, fim_em, duracao, tags(valor)")
      .eq("processo_id", id)
      .order("inicio_em", { ascending: false }),
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
      .select("id, data, horario, observacao")
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
    .select("id, origem_tipo, origem_id, ordem, label, concluida")
    .eq("processo_id", id)
    .in("origem_id", origensAtivas.length > 0 ? origensAtivas : ["00000000-0000-0000-0000-000000000000"])
    .order("ordem");

  const gruposTarefas = Array.from(
    (tarefasRaw ?? []).reduce((acc, t) => {
      const grupo = acc.get(t.origem_id) ?? {
        origemId: t.origem_id,
        origemTipo: t.origem_tipo,
        nome: nomeOrigem.get(t.origem_id) ?? t.origem_tipo,
        tarefas: [] as { id: string; label: string; concluida: boolean }[],
      };
      grupo.tarefas.push({ id: t.id, label: t.label, concluida: t.concluida });
      acc.set(t.origem_id, grupo);
      return acc;
    }, new Map<string, { origemId: string; origemTipo: string; nome: string; tarefas: { id: string; label: string; concluida: boolean }[] }>()).values(),
  );

  const secao: React.CSSProperties = { ...card, marginTop: 16 };

  const grupoKanban = gruposTarefas.find((g) => g.origemTipo === "kanban");
  const aguardando = grupoKanban?.tarefas.find((t) => !t.concluida)?.label ?? null;
  const dias = diasRestantes(p.prazo_data);
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

      <div style={secao}>
        <Cobertura
          processoId={p.id}
          titular={p.titular}
          responsavelAtual={p.responsavel}
          motivoBackup={p.motivo_backup}
          pessoas={pessoas ?? []}
        />
      </div>

      <div style={secao}>
        <PainelProcesso
          processoId={p.id}
          etapaAtual={p.etapa_atual}
          tagsAtivas={tagsAtivas}
          tagsDisponiveis={tagsDisponiveis ?? []}
        />
      </div>

      <div style={secao}>
        <Prazo processoId={p.id} prazoData={p.prazo_data} />
      </div>

      <div style={secao}>
        <Agendamentos processoId={p.id} agendamentos={(agendamentos ?? []) as any} />
      </div>

      <div style={secao}>
        <Cronograma processoId={p.id} execucoes={(execucoes ?? []) as any} />
      </div>

      <div style={secao}>
        <Checklist grupos={gruposTarefas} />
      </div>

      <div style={secao}>
        <Andamentos
          processoId={p.id}
          autorId={pessoaAtual?.id ?? null}
          numeroContrato={p.numero_contrato}
          andamentos={(andamentosRaw ?? []) as any}
        />
      </div>

      <div style={secao}>
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

      <div style={secao}>
        <h2 style={{ fontSize: 15, marginTop: 0 }}>Histórico de kanban</h2>
        <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13 }}>
          {(kanbanHistorico ?? []).map((h: any, i: number) => (
            <li key={i}>
              {h.kanban} — entrada {new Date(h.entrada_em).toLocaleString("pt-BR")}
              {h.saida_em
                ? `, saída ${new Date(h.saida_em).toLocaleString("pt-BR")}`
                : " (atual)"}
            </li>
          ))}
        </ul>
      </div>

      <div style={secao}>
        <h2 style={{ fontSize: 15, marginTop: 0 }}>Histórico de eventos</h2>
        <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13 }}>
          {(tagHistorico ?? []).length === 0 && (
            <li style={{ color: cor.textoTerciario }}>Nenhum registro ainda.</li>
          )}
          {(tagHistorico ?? []).map((h: any, i: number) => (
            <li key={i}>
              {h.tags?.valor} — início {new Date(h.inicio_em).toLocaleString("pt-BR")}
              {h.fim_em ? `, fim ${new Date(h.fim_em).toLocaleString("pt-BR")}` : " (ativo)"}
            </li>
          ))}
        </ul>
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
          <ConclusaoRelatorio
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
          {formatarData(p.prazo_data)} · {textoPrazo(dias)}
          {aguardando && <span style={{ color: cor.textoSecundario, fontWeight: 400 }}>· Aguarda: {aguardando}</span>}
        </div>
      )}
    </div>
  );

  const corpo = <Abas processo={conteudoProcesso} relatorio={conteudoRelatorio} />;

  return { topo, corpo };
}
