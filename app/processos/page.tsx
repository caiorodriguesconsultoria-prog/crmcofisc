import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ListaProcessos from "./lista";
import { botaoPrimario, cor } from "@/lib/theme";
import Painel from "@/app/_ui/painel";
import { getPessoasAtivas, getTagsEvento } from "@/lib/dados-referencia";

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
    { data: agendamentosRaw },
    { data: tarefasAgendadasRaw },
  ] = await Promise.all([
    supabase
      .from("processos")
      .select(
        "id, numero_contrato, nup_principal, objeto, etapa_atual, coordenacao_id, coordenacoes(sigla), fornecedores(nome), forma_entrega_tag_id, responsavel_atual_id, responsavel:pessoas!processos_responsavel_atual_id_fkey(nome), processo_eletronico_numero, processo_tags(tags(id, valor))",
      )
      .order("created_at", { ascending: false }),
    supabase.from("coordenacoes").select("id, sigla").order("sigla"),
    supabase.from("tags").select("id, valor").eq("categoria", "forma_entrega").eq("ativo", true).order("valor"),
    getTagsEvento(),
    getPessoasAtivas(),
    supabase.from("processo_agendamentos").select("processo_id, data, horario").gte("data", hoje),
    supabase
      .from("processo_tarefas")
      .select("processo_id, agendamento_data, agendamento_horario")
      .eq("origem_tipo", "evento")
      .eq("concluida", false)
      .not("agendamento_data", "is", null)
      .gte("agendamento_data", hoje),
  ]);

  const proximoAgendamentoPorProcesso = new Map<string, { data: string; horario: string }>();
  function considerar(processoId: string, data: string, horario: string) {
    const atual = proximoAgendamentoPorProcesso.get(processoId);
    if (!atual || data < atual.data || (data === atual.data && horario < atual.horario)) {
      proximoAgendamentoPorProcesso.set(processoId, { data, horario });
    }
  }
  for (const a of agendamentosRaw ?? []) {
    considerar(a.processo_id, a.data, a.horario);
  }
  for (const t of tarefasAgendadasRaw ?? []) {
    considerar(t.processo_id, t.agendamento_data as string, t.agendamento_horario as string);
  }
  const processosComAgendamento = (processos ?? []).map((p) => ({
    ...p,
    proximoAgendamento: proximoAgendamentoPorProcesso.get(p.id) ?? null,
  }));

  const eventoSelecionado = sp.evento ? (eventos ?? []).find((e) => e.id === sp.evento) : null;
  const titulo = sp.etapa || eventoSelecionado?.valor || "Processos";

  return (
    <Painel
      titulo={titulo}
      subtitulo={titulo !== "Processos" ? "Processos" : undefined}
      voltarHref="/dashboard"
      maxWidth={1300}
      acao={
        <Link href="/processos/novo" style={{ ...botaoPrimario, textDecoration: "none" }}>
          + Novo processo
        </Link>
      }
    >
      {error && <p style={{ color: cor.urgente }}>Erro ao carregar: {error.message}</p>}

      <ListaProcessos
        processos={processosComAgendamento as any}
        coordenacoes={coordenacoes ?? []}
        formasEntrega={formasEntrega ?? []}
        eventos={eventos ?? []}
        responsaveis={responsaveis ?? []}
      />
    </Painel>
  );
}
