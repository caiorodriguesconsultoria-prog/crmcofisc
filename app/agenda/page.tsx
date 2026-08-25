import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import Calendario from "./calendario";
import { card, cor } from "@/lib/theme";
import Painel from "@/app/_ui/painel";

export default async function AgendaPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  if (!user) {
    redirect("/login");
  }

  const [{ data: processos, error }, { data: agendamentosRaw }, { data: tarefasAgendadasRaw }] = await Promise.all([
    supabase
      .from("processos")
      .select("id, numero_contrato, prazo_data, coordenacoes(sigla), fornecedores(nome)")
      .not("prazo_data", "is", null)
      .order("prazo_data"),
    supabase
      .from("processo_agendamentos")
      .select("id, data, horario, observacao, processos(id, numero_contrato)")
      .order("data")
      .order("horario"),
    supabase
      .from("processo_tarefas")
      .select("id, label, agendamento_data, agendamento_horario, processos(id, numero_contrato)")
      .eq("origem_tipo", "evento")
      .eq("concluida", false)
      .not("agendamento_data", "is", null)
      .order("agendamento_data")
      .order("agendamento_horario"),
  ]);

  const prazos = (processos ?? []).map((p: any) => ({
    id: p.id,
    numeroContrato: p.numero_contrato,
    prazoData: p.prazo_data as string,
    coordenacaoSigla: p.coordenacoes?.sigla ?? "",
    fornecedorNome: p.fornecedores?.nome ?? "",
  }));

  const agendamentos = [
    ...(agendamentosRaw ?? [])
      .filter((a: any) => a.processos)
      .map((a: any) => ({
        id: a.id,
        processoId: a.processos.id,
        numeroContrato: a.processos.numero_contrato,
        data: a.data as string,
        horario: a.horario as string,
        observacao: a.observacao as string | null,
      })),
    ...(tarefasAgendadasRaw ?? [])
      .filter((t: any) => t.processos)
      .map((t: any) => ({
        id: t.id,
        processoId: t.processos.id,
        numeroContrato: t.processos.numero_contrato,
        data: t.agendamento_data as string,
        horario: t.agendamento_horario as string,
        observacao: t.label as string | null,
      })),
  ];

  const token = process.env.AGENDA_ICS_TOKEN;
  const host = (await headers()).get("host");
  const linkIcs = token && host ? `https://${host}/api/agenda.ics?token=${token}` : null;

  return (
    <Painel titulo="Agenda" voltarHref="/dashboard" maxWidth={900}>
      {error && <p style={{ color: cor.urgente }}>Erro ao carregar: {error.message}</p>}

      <div style={{ ...card, padding: "10px 14px" }}>
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

      <Calendario prazos={prazos} agendamentos={agendamentos} />
    </Painel>
  );
}
