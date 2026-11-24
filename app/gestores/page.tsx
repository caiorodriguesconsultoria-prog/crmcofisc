import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ListaPessoasPapel from "../_pessoas-papel/lista";
import TelaComBarraTopo from "@/app/_ui/tela-com-barra-topo";
import { getContextoBarraTopo } from "@/lib/contexto-barra-topo";

export default async function GestoresPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  if (!user) {
    redirect("/login");
  }

  const [{ data: pessoa }, { data: papeis, error }, contexto] = await Promise.all([
    supabase.from("pessoas").select("is_admin").eq("auth_user_id", user.id).maybeSingle(),
    // CRM Premium, Etapa 2 — unificação de Gestores e Fiscais numa página só
    // (seção 4 do CRM_PREMIUM_SPEC.md): busca os dois papéis juntos agora,
    // sem o .eq("papel", ...) que separava as duas páginas antigas.
    supabase
      .from("pessoa_papeis")
      .select("pessoa_id, papel, pessoas(id, nome, matricula, ausencia_inicio, ausencia_fim)")
      .in("papel", ["gestor", "fiscal"]),
    getContextoBarraTopo(supabase, user.email ?? null),
  ]);

  const itens = (papeis ?? [])
    .map((p: any) => ({
      id: p.pessoas?.id ?? p.pessoa_id,
      papel: p.papel as "gestor" | "fiscal",
      nome: p.pessoas?.nome ?? "",
      matricula: p.pessoas?.matricula ?? null,
      ausenciaInicio: p.pessoas?.ausencia_inicio ?? null,
      ausenciaFim: p.pessoas?.ausencia_fim ?? null,
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome));

  return (
    <TelaComBarraTopo {...contexto} emailUsuario={user.email ?? undefined} migalha="Gestores e Fiscais">
      <ListaPessoasPapel isAdmin={pessoa?.is_admin ?? false} itens={itens} erro={error?.message} />
    </TelaComBarraTopo>
  );
}
