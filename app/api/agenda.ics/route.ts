import { createServiceClient } from "@/lib/supabase/service";
import { numeroContratoSemSei } from "@/lib/numero-contrato";

function escaparTexto(texto: string) {
  return texto.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n");
}

function formatarDataIcs(data: string) {
  return data.slice(0, 10).replace(/-/g, "");
}

function formatarCarimboIcs(data: Date) {
  return data.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

// Brasil não observa horário de verão desde 2019 — UTC-3 fixo é seguro aqui.
// Parse manual (em vez de `new Date("YYYY-MM-DDTHH:mm")`) pra não depender
// do timezone configurado no runtime que serve a função.
function formatarDataHoraIcs(data: string, horario: string) {
  const [ano, mes, dia] = data.split("-").map(Number);
  const [hora, minuto] = horario.split(":").map(Number);
  const utc = new Date(Date.UTC(ano, mes - 1, dia, hora + 3, minuto));
  return formatarCarimboIcs(utc);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!process.env.AGENDA_ICS_TOKEN || token !== process.env.AGENDA_ICS_TOKEN) {
    return new Response("Não autorizado", { status: 403 });
  }

  const supabase = createServiceClient();
  const [
    { data: processos, error },
    { data: agendamentos, error: erroAgendamentos },
    { data: andamentosAgendados, error: erroAndamentos },
  ] = await Promise.all([
    supabase
      .from("processos")
      .select("id, numero_contrato, etapa_atual, prazo_data, coordenacoes(sigla), fornecedores(nome)")
      .not("prazo_data", "is", null),
    supabase
      .from("processo_agendamentos")
      .select("id, data, horario, observacao, processos(id, numero_contrato)"),
    supabase
      .from("andamentos")
      .select("id, texto, agendamento_data, agendamento_horario, processos(id, numero_contrato)")
      .not("agendamento_data", "is", null),
  ]);

  if (error || erroAgendamentos || erroAndamentos) {
    return new Response("Erro ao carregar agenda", { status: 500 });
  }

  const agora = formatarCarimboIcs(new Date());

  const eventosPrazo = (processos ?? [])
    .map((p: any) => {
      const resumo = escaparTexto(`CT nº ${numeroContratoSemSei(p.numero_contrato)} - ${p.etapa_atual}`);
      const descricao = escaparTexto(
        `Coordenação: ${p.coordenacoes?.sigla ?? ""} · Fornecedor: ${p.fornecedores?.nome ?? ""}`,
      );
      return [
        "BEGIN:VEVENT",
        `UID:${p.id}@crmcofisc`,
        `DTSTAMP:${agora}`,
        `DTSTART;VALUE=DATE:${formatarDataIcs(p.prazo_data)}`,
        `SUMMARY:${resumo}`,
        `DESCRIPTION:${descricao}`,
        `URL:${url.origin}/processos/${p.id}`,
        "END:VEVENT",
      ].join("\r\n");
    })
    .join("\r\n");

  // Agendamentos de entrega e tarefas de checklist com horário marcado —
  // título "CT {numero} - {tarefa}" conforme pedido; ao concluir a tarefa
  // (ou apagar o agendamento) ela some daqui, e o Google reflete isso na
  // próxima sincronização (feed é só leitura, sem push).
  const eventosAgendamento = [
    ...(agendamentos ?? [])
      .filter((a: any) => a.processos)
      .map((a: any) => ({
        id: `agendamento-${a.id}`,
        processoId: a.processos.id,
        numeroContrato: numeroContratoSemSei(a.processos.numero_contrato),
        data: a.data as string,
        horario: a.horario as string,
        tarefa: (a.observacao as string | null) ?? "Agendamento de entrega",
      })),
    ...(andamentosAgendados ?? [])
      .filter((a: any) => a.processos)
      .map((a: any) => ({
        id: `andamento-${a.id}`,
        processoId: a.processos.id,
        numeroContrato: numeroContratoSemSei(a.processos.numero_contrato),
        data: a.agendamento_data as string,
        horario: a.agendamento_horario as string,
        tarefa: a.texto as string,
      })),
  ]
    .map((e) => {
      const resumo = escaparTexto(`CT ${e.numeroContrato} - ${e.tarefa}`);
      return [
        "BEGIN:VEVENT",
        `UID:${e.id}@crmcofisc`,
        `DTSTAMP:${agora}`,
        `DTSTART:${formatarDataHoraIcs(e.data, e.horario)}`,
        "DURATION:PT30M",
        `SUMMARY:${resumo}`,
        `URL:${url.origin}/processos/${e.processoId}`,
        "END:VEVENT",
      ].join("\r\n");
    })
    .join("\r\n");

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//CRM-COFISC//Agenda//PT-BR",
    "CALSCALE:GREGORIAN",
    "X-WR-CALNAME:CRM-COFISC — Prazos",
    eventosPrazo,
    eventosAgendamento,
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": "inline; filename=crmcofisc-prazos.ics",
    },
  });
}
