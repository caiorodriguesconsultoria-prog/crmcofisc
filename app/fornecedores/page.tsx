import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ListaFornecedores from "./lista";

export default async function FornecedoresPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  if (!user) {
    redirect("/login");
  }

  const [{ data: pessoa }, { data: fornecedores, error }] = await Promise.all([
    supabase.from("pessoas").select("is_admin").eq("auth_user_id", user.id).maybeSingle(),
    supabase
      .from("fornecedores")
      .select("id, nome, cnpj, preposto, telefone, fornecedor_emails(email, rotulo)")
      .order("nome"),
  ]);

  const isAdmin = pessoa?.is_admin ?? false;

  return (
    <ListaFornecedores
      fornecedores={(fornecedores ?? []) as any}
      isAdmin={isAdmin}
      erro={error?.message}
    />
  );
}
