import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import Calendario from "./calendario";

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
    <main style={{ padding: 32 }}>
      <p>
        <Link href="/dashboard">← Voltar</Link>
      </p>
      <h1 style={{ fontSize: 20, marginTop: 12 }}>Agenda</h1>

      {error && <p style={{ color: "#B0655C" }}>Erro ao carregar: {error.message}</p>}

      {linkIcs ? (
        <p style={{ fontSize: 12, color: "#605D5D", marginTop: 4 }}>
          Link pra assinar no Google Calendar (Outros calendários → Inscrever-se por URL):{" "}
          <code style={{ userSelect: "all" }}>{linkIcs}</code>
        </p>
      ) : (
        <p style={{ fontSize: 12, color: "#7D7979", marginTop: 4 }}>
          Exportação pro Google Calendar ainda não configurada (variáveis de ambiente pendentes).
        </p>
      )}

      <Calendario prazos={prazos} />
    </main>
  );
}
