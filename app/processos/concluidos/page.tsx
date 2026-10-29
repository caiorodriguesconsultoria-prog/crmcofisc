import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ListaProcessos from "../lista";
import { cor } from "@/lib/theme";
import Painel from "@/app/_ui/painel";
import TelaComBarraTopo from "@/app/_ui/tela-com-barra-topo";
import { getContextoBarraTopo } from "@/lib/contexto-barra-topo";
import { getEtapasKanban, getPessoasAtivas, getTagsEvento } from "@/lib/dados-referencia";

export default async function ProcessosConcluidosPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  if (!user) {
    redirect("/login");
  }

  const [
    { data: processos, error },
    { data: coordenacoes },
    { data: formasEntrega },
    eventos,
    responsaveis,
    etapas,
    { data: pessoaAtual },
    { data: andamentosRaw },
    contexto,
  ] = await Promise.all([
    supabase
      .from("processos")
      .select(
        "id, numero_contrato, nup_principal, objeto, etapa_atual, coordenacao_id, coordenacoes(sigla), fornecedores(nome), forma_entrega_tag_id, titular_id, responsavel_atual_id, responsavel:pessoas!processos_responsavel_atual_id_fkey(nome), processo_eletronico_numero, processo_tags(tags(id, valor, cor))",
      )
      .not("conclusao_tipo", "is", null)
      .order("updated_at", { ascending: false }),
    supabase.from("coordenacoes").select("id, sigla").order("sigla"),
    supabase.from("tags").select("id, valor").eq("categoria", "forma_entrega").eq("ativo", true).order("valor"),
    getTagsEvento(),
    getPessoasAtivas(),
    getEtapasKanban(),
    supabase.from("pessoas").select("id").eq("auth_user_id", user.id).maybeSingle(),
    supabase
      .from("andamentos")
      .select("processo_id, texto, data")
      .neq("tipo", "Tarefa concluída")
      .order("data", { ascending: false }),
    getContextoBarraTopo(supabase, user.email ?? null),
  ]);

  const ultimoAndamentoPorProcesso = new Map<string, string>();
  for (const a of andamentosRaw ?? []) {
    if (!ultimoAndamentoPorProcesso.has(a.processo_id)) {
      ultimoAndamentoPorProcesso.set(a.processo_id, a.texto);
    }
  }

  const processosSemAgendamento = (processos ?? []).map((p) => ({
    ...p,
    proximoAgendamento: null,
    ultimoAndamento: ultimoAndamentoPorProcesso.get(p.id) ?? null,
    entregaAtrasada: false,
    relatorioDesatualizado: false,
  }));

  return (
    <TelaComBarraTopo {...contexto} emailUsuario={user.email ?? undefined} migalha="Contratos > Concluídos">
      <Painel titulo="Concluídos" subtitulo="Contratos" maxWidth={1300}>
        {error && <p style={{ color: cor.urgente }}>Erro ao carregar: {error.message}</p>}

        <ListaProcessos
          processos={processosSemAgendamento as any}
          coordenacoes={coordenacoes ?? []}
          formasEntrega={formasEntrega ?? []}
          eventos={eventos ?? []}
          responsaveis={responsaveis ?? []}
          etapas={etapas ?? []}
          minhaPessoaId={pessoaAtual?.id ?? null}
        />
      </Painel>
    </TelaComBarraTopo>
  );
}
