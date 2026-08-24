import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NovoFornecedorForm from "./form";
import Painel from "@/app/_ui/painel";

export default async function NovoFornecedorPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: pessoa } = await supabase
    .from("pessoas")
    .select("is_admin")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!pessoa?.is_admin) {
    redirect("/fornecedores");
  }

  return (
    <Painel titulo="Novo fornecedor" voltarHref="/fornecedores" maxWidth={480}>
      <NovoFornecedorForm />
    </Painel>
  );
}
