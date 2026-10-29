import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Painel from "@/app/_ui/painel";
import BarraTopo from "@/app/_ui/barra-topo";
import Gerenciador from "./gerenciador";

// Tela simples de cadastro de tags (Etapa 5 do redesenho) — coordenações já
// têm tela própria (/coordenacoes), só linkada daqui. "Tags" aqui cobre
// evento e forma de entrega, que hoje só podiam ser criadas (nunca editadas
// ou desativadas) no meio do filtro de /processos.
export default async function TagsPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  if (!user) {
    redirect("/login");
  }

  const hoje = new Date().toISOString().slice(0, 10);

  const [
    { data: tags, error },
    { count: contagemProcessosAtivosRaw },
    { data: agendamentosHoje },
  ] = await Promise.all([
    supabase.from("tags").select("id, categoria, valor, cor, ativo").order("categoria").order("valor"),
    supabase.from("processos").select("id", { count: "exact", head: true }).is("conclusao_tipo", null),
    supabase.from("processo_agendamentos").select("id").eq("data", hoje),
  ]);

  const contagemProcessosAtivos = contagemProcessosAtivosRaw ?? 0;
  const iniciaisUsuario = (user.email ?? "?")
    .split("@")[0]
    .split(/[._-]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join("") || "?";
  const atualizadoEm = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="crm-painel-fundo" style={{ flexDirection: "column", alignItems: "center" }}>
      <BarraTopo
        contagemProcessosAtivos={contagemProcessosAtivos}
        contagemAgendaHoje={(agendamentosHoje ?? []).length}
        temAlerta={false}
        iniciaisUsuario={iniciaisUsuario}
        emailUsuario={user.email ?? undefined}
        atualizadoEm={atualizadoEm}
        migalha="Tags"
      />

      <Painel titulo="Tags" subtitulo="Eventos e formas de entrega usados nos contratos" maxWidth={1100}>
        {error && <p style={{ color: "#B0655C" }}>Erro ao carregar: {error.message}</p>}
        <Gerenciador tags={tags ?? []} />
      </Painel>

      <div className="crm-barra-topo-espaco-mobile" />
    </div>
  );
}
