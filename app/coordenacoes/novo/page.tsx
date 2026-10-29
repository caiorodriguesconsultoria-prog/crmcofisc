import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NovaCoordenacaoForm from "./form";
import Painel from "@/app/_ui/painel";
import TelaComBarraTopo from "@/app/_ui/tela-com-barra-topo";
import { getContextoBarraTopo } from "@/lib/contexto-barra-topo";

export default async function NovaCoordenacaoPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  if (!user) {
    redirect("/login");
  }

  const [{ data: pessoa }, contexto] = await Promise.all([
    supabase.from("pessoas").select("is_admin").eq("auth_user_id", user.id).maybeSingle(),
    getContextoBarraTopo(supabase, user.email ?? null),
  ]);

  if (!pessoa?.is_admin) {
    redirect("/coordenacoes");
  }

  return (
    <TelaComBarraTopo {...contexto} emailUsuario={user.email ?? undefined} migalha="Coordenações > Nova">
      <Painel titulo="Nova coordenação" voltarHref="/coordenacoes" maxWidth={480}>
        <NovaCoordenacaoForm />
      </Painel>
    </TelaComBarraTopo>
  );
}
