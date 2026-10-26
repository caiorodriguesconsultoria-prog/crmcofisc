import { createServiceClient } from "@/lib/supabase/service";
import { numeroContratoSemSei } from "@/lib/numero-contrato";

function escaparTexto(texto: string) {
  return texto.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n");
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
  const { data: agendamentos, error: erroAgendamentos } = await supabase
    .from("processo_agendamentos")
    .select("id, data, horario, observacao, processos(id, numero_contrato)");

  if (erroAgendamentos) {
    return new Response("Erro ao carregar agenda", { status: 500 });
  }

  const agora = formatarCarimboIcs(new Date());

  // Só agendamentos de entrega (processo_agendamentos) — "Agenda da COFISC"
  // é só isso agora, por pedido do Caio. Prazo (processos.prazo_data) e
  // tarefas do checklist (processo_tarefas) viram Google Task em vez de
  // evento aqui (prazo por sincronização periódica, ver
  // lib/google-calendar.ts; tarefa por sincronização em tempo real) — os
  // dois entrarem aqui também já causou duplicação no Google antes.
  const eventosAgendamento = (agendamentos ?? [])
    .filter((a: any) => a.processos)
    .map((a: any) => ({
      id: `agendamento-${a.id}`,
      processoId: a.processos.id,
      numeroContrato: numeroContratoSemSei(a.processos.numero_contrato),
      data: a.data as string,
      horario: a.horario as string,
      tarefa: (a.observacao as string | null) ?? "Agendamento de entrega",
    }))
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
    "X-WR-CALNAME:CRM-COFISC — Entregas",
    eventosAgendamento,
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": "inline; filename=crmcofisc-entregas.ics",
    },
  });
}
