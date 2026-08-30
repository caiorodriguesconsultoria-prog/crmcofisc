import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { enviarPush } from "@/lib/push";

type Item = { horario: string; texto: string };

function horaMin(d: Date) {
  return d.toISOString().slice(11, 16);
}

// Brasil não observa horário de verão desde 2019 — UTC-3 fixo é seguro aqui
// (mesma convenção usada em lib/google-calendar.ts).
function agoraBrasilia() {
  return new Date(Date.now() - 3 * 60 * 60 * 1000);
}

export async function POST(request: NextRequest) {
  const segredo = request.headers.get("x-cron-secret");
  if (!segredo || segredo !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  const agora = agoraBrasilia();
  const alvo = new Date(agora.getTime() + 30 * 60 * 1000);
  const janelaInicio = new Date(alvo.getTime() - 5 * 60 * 1000);
  const janelaFim = new Date(alvo.getTime() + 5 * 60 * 1000);
  const dataAlvo = alvo.toISOString().slice(0, 10);
  const horaInicio = `${horaMin(janelaInicio)}:00`;
  const horaFim = `${horaMin(janelaFim)}:00`;

  // Janela estreita (±5 min ao redor de "daqui 30 min") só decide SE dispara
  // agora e marca esses itens como já avisados — não deixa a mesma janela
  // de agendamento avisar duas vezes.
  const [{ data: agendamentosJanela }, { data: andamentosJanela }, { data: tarefasJanela }] = await Promise.all([
    supabase
      .from("processo_agendamentos")
      .select("id")
      .eq("data", dataAlvo)
      .gte("horario", horaInicio)
      .lte("horario", horaFim)
      .eq("lembrete_enviado", false),
    supabase
      .from("andamentos")
      .select("id")
      .eq("agendamento_data", dataAlvo)
      .gte("agendamento_horario", horaInicio)
      .lte("agendamento_horario", horaFim)
      .eq("lembrete_enviado", false),
    supabase
      .from("processo_tarefas")
      .select("id")
      .eq("agendamento_data", dataAlvo)
      .gte("agendamento_horario", horaInicio)
      .lte("agendamento_horario", horaFim)
      .eq("lembrete_enviado", false)
      .eq("concluida", false),
  ]);

  const disparar =
    (agendamentosJanela?.length ?? 0) + (andamentosJanela?.length ?? 0) + (tarefasJanela?.length ?? 0) > 0;

  if (!disparar) {
    return NextResponse.json({ ok: true, enviados: 0 });
  }

  await Promise.all([
    agendamentosJanela && agendamentosJanela.length > 0
      ? supabase
          .from("processo_agendamentos")
          .update({ lembrete_enviado: true })
          .in("id", agendamentosJanela.map((a) => a.id))
      : Promise.resolve(),
    andamentosJanela && andamentosJanela.length > 0
      ? supabase
          .from("andamentos")
          .update({ lembrete_enviado: true })
          .in("id", andamentosJanela.map((a) => a.id))
      : Promise.resolve(),
    tarefasJanela && tarefasJanela.length > 0
      ? supabase
          .from("processo_tarefas")
          .update({ lembrete_enviado: true })
          .in("id", tarefasJanela.map((t) => t.id))
      : Promise.resolve(),
  ]);

  // Corpo da notificação: todo o resto do dia (hora >= agora), não só o que
  // entrou na janela — pra quem abrir/expandir a notificação ver a agenda
  // inteira que falta, não só o próximo item.
  const dataHoje = agora.toISOString().slice(0, 10);
  const horaAgora = `${horaMin(agora)}:00`;

  const [{ data: agendamentosDia }, { data: andamentosDia }, { data: tarefasDia }] = await Promise.all([
    supabase
      .from("processo_agendamentos")
      .select("horario, observacao, processos(numero_contrato)")
      .eq("data", dataHoje)
      .gte("horario", horaAgora),
    supabase
      .from("andamentos")
      .select("agendamento_horario, texto, processos(numero_contrato)")
      .eq("agendamento_data", dataHoje)
      .gte("agendamento_horario", horaAgora),
    supabase
      .from("processo_tarefas")
      .select("agendamento_horario, label, processos(numero_contrato)")
      .eq("agendamento_data", dataHoje)
      .gte("agendamento_horario", horaAgora)
      .eq("concluida", false),
  ]);

  const itens: Item[] = [];
  for (const a of agendamentosDia ?? []) {
    itens.push({
      horario: (a.horario as string).slice(0, 5),
      texto: `CT ${(a as any).processos?.numero_contrato ?? "?"} — ${a.observacao || "Entrega"}`,
    });
  }
  for (const a of andamentosDia ?? []) {
    itens.push({
      horario: (a.agendamento_horario as string).slice(0, 5),
      texto: `CT ${(a as any).processos?.numero_contrato ?? "?"} — ${a.texto}`,
    });
  }
  for (const t of tarefasDia ?? []) {
    itens.push({
      horario: (t.agendamento_horario as string).slice(0, 5),
      texto: `CT ${(t as any).processos?.numero_contrato ?? "?"} — ${t.label}`,
    });
  }
  itens.sort((a, b) => a.horario.localeCompare(b.horario));

  const corpo = itens.map((i) => `${i.horario} · ${i.texto}`).join("\n") || "Sem mais agendamentos hoje.";
  const titulo =
    itens.length === 1 ? "Lembrete: 1 agendamento hoje" : `Lembrete: ${itens.length} agendamentos hoje`;

  const { data: inscricoes } = await supabase.from("push_subscriptions").select("id, endpoint, p256dh, auth");

  let enviados = 0;
  for (const inscricao of inscricoes ?? []) {
    try {
      await enviarPush(
        { endpoint: inscricao.endpoint, keys: { p256dh: inscricao.p256dh, auth: inscricao.auth } },
        { titulo, corpo, url: "/dashboard" },
      );
      enviados++;
    } catch (err: any) {
      if (err?.statusCode === 404 || err?.statusCode === 410) {
        await supabase.from("push_subscriptions").delete().eq("id", inscricao.id);
      }
    }
  }

  return NextResponse.json({ ok: true, enviados, itensNaMensagem: itens.length });
}
