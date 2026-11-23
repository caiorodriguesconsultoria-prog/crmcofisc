import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Painel from "@/app/_ui/painel";
import TelaComBarraTopo from "@/app/_ui/tela-com-barra-topo";
import { getContextoBarraTopo } from "@/lib/contexto-barra-topo";
import Chat from "./chat";

export default async function AssistentePage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  if (!user) {
    redirect("/login");
  }

  const contexto = await getContextoBarraTopo(supabase, user.email ?? null);

  return (
    <TelaComBarraTopo {...contexto} emailUsuario={user.email ?? undefined} migalha="Assistente">
      <Painel titulo="Assistente" subtitulo="Pergunte sobre os contratos — Fase 1, em teste" maxWidth={760} fundoAurora>
        <Chat />
      </Painel>
    </TelaComBarraTopo>
  );
}
