import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { googleConectado } from "@/lib/google-calendar";
import { numeroContratoSemSei } from "@/lib/numero-contrato";
import Calendario from "./calendario";
import { card, cor, botaoPrimario } from "@/lib/theme";
import Painel from "@/app/_ui/painel";

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ google?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  if (!user) {
    redirect("/login");
  }

  const { google: googleStatus } = await searchParams;

  const { data: pessoaAtual } = await supabase
    .from("pessoas")
    .select("is_admin")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  const ehAdmin = !!pessoaAtual?.is_admin;
  const conectadoGoogle = await googleConectado();

  const [{ data: processos, error }, { data: agendamentosRaw }, { data: andamentosAgendadosRaw }, { data: execucoesPendentesRaw }] =
    await Promise.all([
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
        .from("andamentos")
        .select("id, texto, agendamento_data, agendamento_horario, processos(id, numero_contrato)")
        .not("agendamento_data", "is", null)
        .order("agendamento_data")
        .order("agendamento_horario"),
      supabase
        .from("processo_execucoes")
        .select("id, numero, data_prevista, processos(id, numero_contrato)")
        .is("data_entrega", null)
        .not("data_prevista", "is", null),
    ]);

  const prazos = (processos ?? []).map((p: any) => ({
    id: p.id,
    numeroContrato: numeroContratoSemSei(p.numero_contrato),
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
        numeroContrato: numeroContratoSemSei(a.processos.numero_contrato),
        data: a.data as string,
        horario: a.horario as string,
        observacao: a.observacao as string | null,
      })),
    ...(andamentosAgendadosRaw ?? [])
      .filter((a: any) => a.processos)
      .map((a: any) => ({
        id: a.id,
        processoId: a.processos.id,
        numeroContrato: numeroContratoSemSei(a.processos.numero_contrato),
        data: a.agendamento_data as string,
        horario: a.agendamento_horario as string,
        observacao: a.texto as string | null,
      })),
  ];

  // Entrega ainda sem data_entrega e cuja data prevista já passou — mesmo
  // cálculo do cronograma na página do processo (app/processos/[id]/cronograma.tsx),
  // só que aqui olhando pra todos os processos de uma vez, pra dar uma
  // conferida diária num lugar só.
  const hoje = new Date().toISOString().slice(0, 10);
  const entregasEmAtraso = (execucoesPendentesRaw ?? [])
    .filter((e: any) => e.processos && e.data_prevista && e.data_prevista < hoje)
    .map((e: any) => {
      const diffMs = new Date(`${hoje}T00:00:00`).getTime() - new Date(`${e.data_prevista}T00:00:00`).getTime();
      return {
        id: e.id,
        processoId: e.processos.id,
        numeroContrato: numeroContratoSemSei(e.processos.numero_contrato),
        numeroParcela: e.numero as number,
        dias: Math.floor(diffMs / (1000 * 60 * 60 * 24)),
      };
    })
    .sort((a, b) => b.dias - a.dias);

  const token = process.env.AGENDA_ICS_TOKEN;
  const host = (await headers()).get("host");
  const linkIcs = token && host ? `https://${host}/api/agenda.ics?token=${token}` : null;

  return (
    <Painel titulo="Agenda" voltarHref="/dashboard" maxWidth={900}>
      {error && <p style={{ color: cor.urgente }}>Erro ao carregar: {error.message}</p>}

      {googleStatus === "conectado" && (
        <p style={{ fontSize: 12.5, color: cor.positivo, margin: "0 0 10px" }}>
          Google Calendar conectado. Novos agendamentos e tarefas com data passam a aparecer na hora.
        </p>
      )}
      {googleStatus === "erro" && (
        <p style={{ fontSize: 12.5, color: cor.urgente, margin: "0 0 10px" }}>
          Não deu pra conectar ao Google Calendar. Confira as variáveis de ambiente e tente de novo.
        </p>
      )}
      {googleStatus === "sem-refresh-token" && (
        <p style={{ fontSize: 12.5, color: cor.urgente, margin: "0 0 10px" }}>
          O Google não devolveu autorização permanente. Tente de novo — se persistir, revogue o acesso do
          app em myaccount.google.com/permissions e refaça a conexão.
        </p>
      )}

      <div style={{ ...card, padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <p style={{ fontSize: 12.5, margin: 0, color: conectadoGoogle ? cor.positivo : cor.textoTerciario }}>
          {conectadoGoogle ? "✓ Google Calendar conectado — sincronização em tempo real ativa." : "Google Calendar não conectado — agendamentos só aparecem lá pelo feed .ics (com atraso)."}
        </p>
        {ehAdmin && (
          <a href="/api/google/auth" style={{ ...botaoPrimario, fontSize: 11.5, padding: "6px 14px", textDecoration: "none" }}>
            {conectadoGoogle ? "Reconectar" : "Conectar Google Calendar"}
          </a>
        )}
      </div>

      <div style={{ ...card, padding: "10px 14px", marginTop: 10 }}>
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

      {entregasEmAtraso.length > 0 && (
        <div style={{ ...card, padding: "10px 14px", marginTop: 10 }}>
          <p style={{ fontSize: 11.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6, color: cor.urgente, margin: "0 0 8px" }}>
            Entregas em atraso
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {entregasEmAtraso.map((e) => (
              <a
                key={e.id}
                href={`/processos/${e.processoId}`}
                style={{ fontSize: 12.5, color: cor.urgente, textDecoration: "none" }}
              >
                CT {e.numeroContrato} - {e.numeroParcela}ª Parcela — {e.dias} dia{e.dias > 1 ? "s" : ""} em atraso
              </a>
            ))}
          </div>
        </div>
      )}

      <Calendario prazos={prazos} agendamentos={agendamentos} />
    </Painel>
  );
}
