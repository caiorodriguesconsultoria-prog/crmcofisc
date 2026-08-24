import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PainelProcesso from "./painel";
import Andamentos from "./andamentos";
import Cobertura from "./cobertura";
import Checklist from "./checklist";
import GestaoFiscalizacao from "./gestao-fiscalizacao";
import Nups from "./nups";
import Prazo from "./prazo";
import Cronograma from "./cronograma";
import Conclusao from "./conclusao";
import { card, cor, pill } from "@/lib/theme";
import Painel from "@/app/_ui/painel";

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

export default async function ProcessoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: processo, error: erroProcesso } = await supabase
    .from("processos")
    .select(
      "id, numero_contrato, nup_principal, objeto, etapa_atual, motivo_backup, coordenacao_id, prazo_data, conclusao_tipo, conclusao_checks, conclusao_texto, conclusao_penalidade, coordenacoes(sigla), fornecedores(nome), titular:pessoas!processos_titular_id_fkey(id, nome), responsavel:pessoas!processos_responsavel_atual_id_fkey(id, nome), gestor:pessoas!processos_gestor_id_fkey(id, nome), gestor_substituto:pessoas!processos_gestor_substituto_id_fkey(id, nome), fiscal:pessoas!processos_fiscal_id_fkey(id, nome), fiscal_substituto:pessoas!processos_fiscal_substituto_id_fkey(id, nome)",
    )
    .eq("id", id)
    .single();

  if (erroProcesso || !processo) {
    notFound();
  }

  const p = processo as any;

  const [
    { data: tagsAtivasRaw },
    { data: tagsDisponiveis },
    { data: kanbanHistorico },
    { data: tagHistorico },
    { data: andamentosRaw },
    { data: pessoaAtual },
    { data: pessoas },
    { data: papeis },
    { data: nups },
    { data: execucoes },
  ] = await Promise.all([
    supabase.from("processo_tags").select("tag_id, tags(id, valor)").eq("processo_id", id),
    supabase
      .from("tags")
      .select("id, valor")
      .eq("categoria", "evento")
      .eq("ativo", true)
      .order("valor"),
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
    supabase.from("pessoas").select("id, nome").eq("ativo", true).order("nome"),
    supabase
      .from("pessoa_papeis")
      .select("pessoa_id, papel, pessoas(nome)")
      .in("papel", ["gestor", "fiscal"]),
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

  const [{ data: kanbanAtivo }, { data: tagHistoricoAtivo }] = await Promise.all([
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

  return (
    <Painel
      titulo={p.numero_contrato}
      subtitulo={`${p.nup_principal} · ${p.coordenacoes?.sigla ?? ""} · ${p.fornecedores?.nome ?? ""}`}
      voltarHref="/processos"
      maxWidth={760}
      acao={<Link href={`/processos/${p.id}/relatorio`}>Ver Relatório →</Link>}
    >
      <div style={{ ...card, display: "flex", alignItems: "center", gap: 10 }}>
        {dias !== null && (
          <span style={{ width: 9, height: 9, borderRadius: "50%", background: dot ?? undefined, flex: "none" }} />
        )}
        <div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>
            {dias !== null ? `${formatarData(p.prazo_data)} · ${textoPrazo(dias)}` : "Sem prazo definido"}
          </div>
          {aguardando && (
            <div style={{ fontSize: 11.5, color: cor.textoSecundario, marginTop: 2 }}>Aguarda: {aguardando}</div>
          )}
        </div>
        <span style={{ ...pill, marginLeft: "auto", background: cor.destaqueFundo, color: cor.destaque }}>
          {p.etapa_atual}
        </span>
      </div>

      <p style={{ margin: "12px 0 0", fontSize: 13.5 }}>{p.objeto}</p>

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
        <Nups processoId={p.id} nupRelatorio={nupRelatorio} nupPagamento={nupPagamento} />
      </div>

      <div style={secao}>
        <Prazo processoId={p.id} prazoData={p.prazo_data} />
      </div>

      <div style={secao}>
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
    </Painel>
  );
}
