import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NovaCoordenacaoForm from "./form";
import Painel from "@/app/_ui/painel";

export default async function NovaCoordenacaoPage() {
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
    redirect("/coordenacoes");
  }

  return (
    <Painel titulo="Nova coordenação" voltarHref="/coordenacoes" maxWidth={480}>
      <NovaCoordenacaoForm />
    </Painel>
  );
}
