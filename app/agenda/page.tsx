import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import Calendario from "./calendario";
import { card, cor } from "@/lib/theme";

export default async function AgendaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: processos, error } = await supabase
    .from("processos")
    .select("id, numero_contrato, prazo_data, coordenacoes(sigla), fornecedores(nome)")
    .not("prazo_data", "is", null)
    .order("prazo_data");

  const prazos = (processos ?? []).map((p: any) => ({
    id: p.id,
    numeroContrato: p.numero_contrato,
    prazoData: p.prazo_data as string,
    coordenacaoSigla: p.coordenacoes?.sigla ?? "",
    fornecedorNome: p.fornecedores?.nome ?? "",
  }));

  const token = process.env.AGENDA_ICS_TOKEN;
  const host = (await headers()).get("host");
  const linkIcs = token && host ? `https://${host}/api/agenda.ics?token=${token}` : null;

  return (
    <main style={{ padding: 32, maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ fontSize: 20 }}>Agenda</h1>

      {error && <p style={{ color: cor.urgente }}>Erro ao carregar: {error.message}</p>}

      <div style={{ ...card, marginTop: 12, padding: "10px 14px" }}>
        {linkIcs ? (
          <p style={{ fontSize: 12, color: cor.textoSecundario, margin: 0 }}>
            Link pra assinar no Google Calendar (Outros calendários → Inscrever-se por URL):{" "}
            <code style={{ userSelect: "all" }}>{linkIcs}</code>
          </p>
        ) : (
          <p style={{ fontSize: 12, color: cor.textoTerciario, margin: 0 }}>
            Exportação pro Google Calendar ainda não configurada (variáveis de ambiente pendentes).
          </p>
        )}
      </div>

      <Calendario prazos={prazos} />
    </main>
  );
}
