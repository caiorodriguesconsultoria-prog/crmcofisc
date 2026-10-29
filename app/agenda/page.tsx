import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { googleConectado } from "@/lib/google-calendar";
import { numeroContratoSemSei } from "@/lib/numero-contrato";
import Calendario from "./calendario";
import Semana from "./semana";
import { card, cor, botaoPrimario } from "@/lib/theme";
import Painel from "@/app/_ui/painel";
import BarraTopo from "@/app/_ui/barra-topo";

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

  const hoje = new Date().toISOString().slice(0, 10);

  const [
    { data: processos, error },
    { data: agendamentosRaw },
    { data: tarefasAgendadasRaw },
    { count: contagemProcessosAtivosRaw },
  ] = await Promise.all([
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
    // Tarefas do checklist com data marcada — antes não entravam na Agenda
    // de jeito nenhum (só agendamentos de entrega). Concluídas não aparecem
    // mais, já cumpriram o papel.
    supabase
      .from("processo_tarefas")
      .select("id, label, agendamento_data, processos(id, numero_contrato)")
      .eq("concluida", false)
      .not("agendamento_data", "is", null)
      .order("agendamento_data"),
    // Pra BarraTopo — mesmo cálculo simples já usado em /dashboard e
    // /processos, não uma consulta nova de verdade.
    supabase.from("processos").select("id", { count: "exact", head: true }).is("conclusao_tipo", null),
  ]);

  // Tarefas não têm horário (são de dia inteiro) — entram no fim da lista
  // do dia, junto dos demais itens que têm horário exato.
  const HORARIO_TAREFA = "23:59:00";

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
    ...(tarefasAgendadasRaw ?? [])
      .filter((t: any) => t.processos)
      .map((t: any) => ({
        id: t.id,
        processoId: t.processos.id,
        numeroContrato: numeroContratoSemSei(t.processos.numero_contrato),
        data: t.agendamento_data as string,
        horario: HORARIO_TAREFA,
        observacao: t.label as string | null,
      })),
  ];

  const token = process.env.AGENDA_ICS_TOKEN;
  const host = (await headers()).get("host");
  const linkIcs = token && host ? `https://${host}/api/agenda.ics?token=${token}` : null;

  const contagemProcessosAtivos = contagemProcessosAtivosRaw ?? 0;
  const contagemAgendaHoje = agendamentos.filter((a) => a.data.slice(0, 10) === hoje).length;
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
        contagemAgendaHoje={contagemAgendaHoje}
        temAlerta={false}
        iniciaisUsuario={iniciaisUsuario}
        emailUsuario={user.email ?? undefined}
        atualizadoEm={atualizadoEm}
      />

    <Painel titulo="Agenda" maxWidth={900}>
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

      <div style={{ ...card, marginTop: 16 }}>
        <strong style={{ fontSize: 13 }}>Esta semana</strong>
        <div style={{ marginTop: 10 }}>
          <Semana prazos={prazos} agendamentos={agendamentos} />
        </div>
      </div>

      <Calendario prazos={prazos} agendamentos={agendamentos} />
    </Painel>

      <div className="crm-barra-topo-espaco-mobile" />
    </div>
  );
}
