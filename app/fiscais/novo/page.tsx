import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NovaPessoaPapelForm from "../../_pessoas-papel/form";

export default async function NovoFiscalPage() {
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
    redirect("/fiscais");
  }

  return <NovaPessoaPapelForm papel="fiscal" titulo="Novo fiscal" voltarHref="/fiscais" />;
}
