import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PainelProcesso from "./painel";
import Andamentos from "./andamentos";
import Cobertura from "./cobertura";

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
      "id, numero_contrato, nup_principal, objeto, etapa_atual, motivo_backup, coordenacoes(sigla), fornecedores(nome), titular:pessoas!processos_titular_id_fkey(id, nome), responsavel:pessoas!processos_responsavel_atual_id_fkey(id, nome)",
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
  ]);

  const tagsAtivas = (tagsAtivasRaw ?? []).map((t: any) => ({
    id: t.tag_id,
    valor: t.tags?.valor ?? "",
  }));

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
