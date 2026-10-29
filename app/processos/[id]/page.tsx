import PainelAlto from "@/app/_ui/painel-alto";
import BarraTopo from "@/app/_ui/barra-topo";
import { createClient } from "@/lib/supabase/server";
import { getContextoBarraTopo } from "@/lib/contexto-barra-topo";
import { carregarProcesso } from "./conteudo";

// Tela cheia (acesso direto por URL/recarregar) — diferente da versão em
// modal (app/@modal/.../processos/[id]/page.tsx, aberta ao clicar num
// contrato na lista), que não leva BarraTopo porque já aparece flutuando
// sobre uma tela que já tem a barra.
export default async function ProcessoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  const [{ topo, corpo }, contexto] = await Promise.all([
    carregarProcesso(id),
    user ? getContextoBarraTopo(supabase, user.email ?? null) : null,
  ]);

  if (!contexto) {
    return (
      <PainelAlto voltarHref="/processos" maxWidth={1400} topo={topo}>
        {corpo}
      </PainelAlto>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
      <BarraTopo {...contexto} temAlerta={false} emailUsuario={user?.email ?? undefined} migalha="Contratos > Detalhe" />
      <PainelAlto voltarHref="/processos" maxWidth={1400} topo={topo}>
        {corpo}
      </PainelAlto>
      <div className="crm-barra-topo-espaco-mobile" />
    </div>
  );
}
