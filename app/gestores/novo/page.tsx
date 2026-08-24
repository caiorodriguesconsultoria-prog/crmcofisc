import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NovaPessoaPapelForm from "../../_pessoas-papel/form";

export default async function NovoGestorPage() {
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
    redirect("/gestores");
  }

  return <NovaPessoaPapelForm papel="gestor" titulo="Novo gestor" voltarHref="/gestores" />;
}
