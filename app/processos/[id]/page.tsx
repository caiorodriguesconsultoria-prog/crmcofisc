import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PainelProcesso from "./painel";
import Andamentos from "./andamentos";
import Cobertura from "./cobertura";
import Checklist from "./checklist";
import GestaoFiscalizacao from "./gestao-fiscalizacao";
import Nups from "./nups";

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
      "id, numero_contrato, nup_principal, objeto, etapa_atual, motivo_backup, coordenacao_id, coordenacoes(sigla), fornecedores(nome), titular:pessoas!processos_titular_id_fkey(id, nome), responsavel:pessoas!processos_responsavel_atual_id_fkey(id, nome), gestor:pessoas!processos_gestor_id_fkey(id, nome), gestor_substituto:pessoas!processos_gestor_substituto_id_fkey(id, nome), fiscal:pessoas!processos_fiscal_id_fkey(id, nome), fiscal_substituto:pessoas!processos_fiscal_substituto_id_fkey(id, nome)",
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
      .select("id, tipo, texto, data, sei_numero, autor:pessoas(nome)")
      .eq("processo_id", id)
      .order("data", { ascending: false }),
    supabase.from("pessoas").select("id").eq("auth_user_id", user.id).maybeSingle(),
    supabase.from("pessoas").select("id, nome").eq("ativo", true).order("nome"),
    supabase
      .from("pessoa_papeis")
      .select("pessoa_id, coordenacao_id, papel, pessoas(nome)")
      .in("papel", ["gestor", "fiscal"]),
    supabase
      .from("processo_nups")
      .select("id, tipo, nup")
      .eq("processo_id", id)
      .in("tipo", ["relatorio", "pagamento"]),
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

  const gestoresDaCoordenacao = (papeis ?? [])
    .filter((pp) => pp.papel === "gestor" && pp.coordenacao_id === p.coordenacao_id)
    .map((pp: any) => ({ id: pp.pessoa_id, nome: pp.pessoas?.nome ?? "" }));
  const fiscaisDaCoordenacao = (papeis ?? [])
    .filter((pp) => pp.papel === "fiscal" && pp.coordenacao_id === p.coordenacao_id)
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

  return (
    <main style={{ padding: 32, maxWidth: 640 }}>
      <p>
        <Link href="/processos">← Voltar</Link>
      </p>
      <h1 style={{ fontSize: 20 }}>{p.numero_contrato}</h1>
      <p style={{ color: "#605D5D" }}>{p.nup_principal}</p>
      <p>{p.objeto}</p>
      <p>
        Coordenação: {p.coordenacoes?.sigla} · Fornecedor: {p.fornecedores?.nome}
      </p>

      <Cobertura
        processoId={p.id}
        titular={p.titular}
        responsavelAtual={p.responsavel}
        motivoBackup={p.motivo_backup}
        pessoas={pessoas ?? []}
      />

      <PainelProcesso
        processoId={p.id}
        etapaAtual={p.etapa_atual}
        tagsAtivas={tagsAtivas}
        tagsDisponiveis={tagsDisponiveis ?? []}
      />

      <Nups processoId={p.id} nupRelatorio={nupRelatorio} nupPagamento={nupPagamento} />

      <GestaoFiscalizacao
        processoId={p.id}
        gestor={p.gestor}
        gestorSubstituto={p.gestor_substituto}
        fiscal={p.fiscal}
        fiscalSubstituto={p.fiscal_substituto}
        gestores={gestoresDaCoordenacao}
        fiscais={fiscaisDaCoordenacao}
      />

      <Checklist grupos={gruposTarefas} />

      <Andamentos
        processoId={p.id}
        autorId={pessoaAtual?.id ?? null}
        andamentos={(andamentosRaw ?? []) as any}
      />

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 16 }}>Histórico de kanban</h2>
        <ul>
          {(kanbanHistorico ?? []).map((h: any, i: number) => (
            <li key={i}>
              {h.kanban} — entrada {new Date(h.entrada_em).toLocaleString("pt-BR")}
              {h.saida_em
                ? `, saída ${new Date(h.saida_em).toLocaleString("pt-BR")}`
                : " (atual)"}
            </li>
          ))}
        </ul>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 16 }}>Histórico de eventos</h2>
        <ul>
          {(tagHistorico ?? []).length === 0 && (
            <li style={{ color: "#7D7979" }}>Nenhum registro ainda.</li>
          )}
          {(tagHistorico ?? []).map((h: any, i: number) => (
            <li key={i}>
              {h.tags?.valor} — início {new Date(h.inicio_em).toLocaleString("pt-BR")}
              {h.fim_em ? `, fim ${new Date(h.fim_em).toLocaleString("pt-BR")}` : " (ativo)"}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
