import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { enviarPush } from "@/lib/push";

// Brasil não observa horário de verão desde 2019 — UTC-3 fixo é seguro aqui
// (mesma convenção usada em lib/google-calendar.ts).
function agoraBrasilia() {
  return new Date(Date.now() - 3 * 60 * 60 * 1000);
}

// Chamado 2x por dia pelo workflow (08h e 14h de Brasília), um POST por
// período — dispara UM push só, juntando todas as tarefas daquele período
// que ainda não foram avisadas. Sem reenvio automático: se não foi
// resolvida, só volta a avisar se alguém reagendar a tarefa manualmente
// (o que zera lembrete_enviado — ver checklist.tsx).
export async function POST(request: NextRequest) {
  const segredo = request.headers.get("x-cron-secret");
  if (!segredo || segredo !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const periodo = (body as { periodo?: string }).periodo;
  if (periodo !== "manha" && periodo !== "tarde") {
    return NextResponse.json({ error: "periodo inválido (esperado 'manha' ou 'tarde')" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const hoje = agoraBrasilia().toISOString().slice(0, 10);

  const { data: tarefas } = await supabase
    .from("processo_tarefas")
    .select("id, label, processos(numero_contrato)")
    .eq("periodo", periodo)
    .eq("agendamento_data", hoje)
    .eq("concluida", false)
    .eq("lembrete_enviado", false);

  if (!tarefas || tarefas.length === 0) {
    return NextResponse.json({ ok: true, enviados: 0 });
  }

  await supabase
    .from("processo_tarefas")
    .update({ lembrete_enviado: true })
    .in("id", tarefas.map((t) => t.id));

  const nomePeriodo = periodo === "manha" ? "manhã" : "tarde";
  const corpo = tarefas.map((t: any) => `CT ${t.processos?.numero_contrato ?? "?"} - ${t.label}`).join("\n");
  const titulo = tarefas.length === 1 ? `Lembrete: 1 tarefa (${nomePeriodo})` : `Lembrete: ${tarefas.length} tarefas (${nomePeriodo})`;

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

  return NextResponse.json({ ok: true, enviados, itensNaMensagem: tarefas.length });
}
