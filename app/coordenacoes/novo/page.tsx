import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NovaCoordenacaoForm from "./form";

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
    <main style={{ padding: 32, maxWidth: 480 }}>
      <h1 style={{ fontSize: 20, marginBottom: 16 }}>Nova coordenação</h1>
      <NovaCoordenacaoForm />
    </main>
  );
}
