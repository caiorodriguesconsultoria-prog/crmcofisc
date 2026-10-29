import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { cor } from "@/lib/theme";
import Painel from "@/app/_ui/painel";
import TelaComBarraTopo from "@/app/_ui/tela-com-barra-topo";
import { getContextoBarraTopo } from "@/lib/contexto-barra-topo";
import ListaAvisos from "./lista";

export default async function AvisosPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  if (!user) {
    redirect("/login");
  }

  const [{ data: avisos, error }, { data: pessoaAtual }, contexto] = await Promise.all([
    supabase
      .from("alertas_sistema")
      .select("id, contexto, mensagem, created_at, lido_em")
      .order("created_at", { ascending: false })
      .limit(200),
    supabase.from("pessoas").select("id").eq("auth_user_id", user.id).maybeSingle(),
    getContextoBarraTopo(supabase, user.email ?? null),
  ]);

  return (
    <TelaComBarraTopo {...contexto} emailUsuario={user.email ?? undefined} migalha="Avisos">
      <Painel titulo="Avisos do sistema" subtitulo="Histórico dos alertas de erro enviados pro celular dos admins." maxWidth={900}>
        {error && <p style={{ color: cor.urgente }}>Erro ao carregar: {error.message}</p>}
        <ListaAvisos avisos={avisos ?? []} minhaPessoaId={pessoaAtual?.id ?? null} />
      </Painel>
    </TelaComBarraTopo>
  );
}
