import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { enviarPush } from "@/lib/push";
import { sincronizarPrazosGoogleTasks } from "@/lib/google-calendar";

// Brasil não observa horário de verão desde 2019 — UTC-3 fixo é seguro aqui
// (mesma convenção usada em lib/google-calendar.ts).
function agoraBrasilia() {
  return new Date(Date.now() - 3 * 60 * 60 * 1000);
}

function autorizado(request: NextRequest): boolean {
  const segredo = process.env.CRON_SECRET;
  if (!segredo) return false;
  // Vercel Cron manda esse header sozinho quando existe uma env var chamada
  // CRON_SECRET — não precisa configurar nada além da variável.
  const auth = request.headers.get("authorization");
  if (auth === `Bearer ${segredo}`) return true;
  // Header próprio, pra chamar manualmente (teste, curl) sem depender do Cron.
  const cabecalhoProprio = request.headers.get("x-cron-secret");
  return cabecalhoProprio === segredo;
}

// Chamado 2x por dia pelo Vercel Cron (08h e 14h de Brasília, ver
// vercel.json) — dispara UM push só, juntando todas as tarefas de hoje
// que ainda não foram avisadas (tarefa não tem mais período, só data —
// quem pegar primeiro no dia avisa; a segunda chamada do dia não acha mais
// nada porque lembrete_enviado já foi marcado). Sem reenvio automático: se
// não foi resolvida, só volta a avisar se alguém reagendar a tarefa
// manualmente (o que zera lembrete_enviado — ver checklist.tsx).
async function executar(request: NextRequest) {
  if (!autorizado(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const hoje = agoraBrasilia().toISOString().slice(0, 10);

  const { data: tarefas } = await supabase
    .from("processo_tarefas")
    .select("id, label, processos(numero_contrato)")
    .eq("agendamento_data", hoje)
    .eq("concluida", false)
    .eq("lembrete_enviado", false);

  // Prazo não tem ação de "salvar" no CRM pra sincronizar na hora — essa
  // rotina (já roda 2x/dia) é o jeito de manter o Google Tasks em dia com
  // os prazos ativos, sem depender de nenhuma tela nova.
  await sincronizarPrazosGoogleTasks(request.nextUrl.origin);

  if (!tarefas || tarefas.length === 0) {
    return NextResponse.json({ ok: true, enviados: 0 });
  }

  await supabase
    .from("processo_tarefas")
    .update({ lembrete_enviado: true })
    .in("id", tarefas.map((t) => t.id));

  const itens = tarefas.map((t: any) => `CT ${t.processos?.numero_contrato ?? "?"} - ${t.label}`);
  // Notificação push mostra só umas poucas linhas do corpo — em vez de
  // deixar cortar no meio de uma tarefa (parecendo incompleto), resume com
  // "e mais N" quando tem muitas.
  const LIMITE_LINHAS = 4;
  const corpo =
    itens.length > LIMITE_LINHAS
      ? [...itens.slice(0, LIMITE_LINHAS), `e mais ${itens.length - LIMITE_LINHAS}...`].join("\n")
      : itens.join("\n");
  const titulo = tarefas.length === 1 ? `Lembrete: 1 tarefa hoje` : `Lembrete: ${tarefas.length} tarefas hoje`;

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

// Vercel Cron sempre chama via GET.
export async function GET(request: NextRequest) {
  return executar(request);
}

// Mantido pra quem quiser disparar manualmente (curl, etc.) com POST.
export async function POST(request: NextRequest) {
  return executar(request);
}
