import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ListaFornecedores from "./lista";
import TelaComBarraTopo from "@/app/_ui/tela-com-barra-topo";
import { getContextoBarraTopo } from "@/lib/contexto-barra-topo";

export default async function FornecedoresPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  if (!user) {
    redirect("/login");
  }

  const [{ data: pessoa }, { data: fornecedores, error }, contexto] = await Promise.all([
    supabase.from("pessoas").select("is_admin").eq("auth_user_id", user.id).maybeSingle(),
    supabase
      .from("fornecedores")
      .select("id, nome, cnpj, preposto, telefone, fornecedor_emails(email, rotulo)")
      .order("nome"),
    getContextoBarraTopo(supabase, user.email ?? null),
  ]);

  const isAdmin = pessoa?.is_admin ?? false;

  return (
    <TelaComBarraTopo {...contexto} emailUsuario={user.email ?? undefined} migalha="Fornecedores">
      <ListaFornecedores
        fornecedores={(fornecedores ?? []) as any}
        isAdmin={isAdmin}
        erro={error?.message}
      />
    </TelaComBarraTopo>
  );
}
