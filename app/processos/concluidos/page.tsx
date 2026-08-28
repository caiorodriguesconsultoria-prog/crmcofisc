import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ListaProcessos from "../lista";
import { cor } from "@/lib/theme";
import Painel from "@/app/_ui/painel";
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

  const [{ data: processos, error }, { data: coordenacoes }, { data: formasEntrega }, eventos, responsaveis, etapas] =
    await Promise.all([
      supabase
        .from("processos")
        .select(
          "id, numero_contrato, nup_principal, objeto, etapa_atual, coordenacao_id, coordenacoes(sigla), fornecedores(nome), forma_entrega_tag_id, responsavel_atual_id, responsavel:pessoas!processos_responsavel_atual_id_fkey(nome), processo_eletronico_numero, processo_tags(tags(id, valor))",
        )
        .not("conclusao_tipo", "is", null)
        .order("updated_at", { ascending: false }),
      supabase.from("coordenacoes").select("id, sigla").order("sigla"),
      supabase.from("tags").select("id, valor").eq("categoria", "forma_entrega").eq("ativo", true).order("valor"),
      getTagsEvento(),
      getPessoasAtivas(),
      getEtapasKanban(),
    ]);

  const processosSemAgendamento = (processos ?? []).map((p) => ({ ...p, proximoAgendamento: null }));

  return (
    <Painel titulo="Concluídos" subtitulo="Processos" voltarHref="/dashboard" maxWidth={1300}>
      {error && <p style={{ color: cor.urgente }}>Erro ao carregar: {error.message}</p>}

      <ListaProcessos
        processos={processosSemAgendamento as any}
        coordenacoes={coordenacoes ?? []}
        formasEntrega={formasEntrega ?? []}
        eventos={eventos ?? []}
        responsaveis={responsaveis ?? []}
        etapas={etapas ?? []}
      />
    </Painel>
  );
}
