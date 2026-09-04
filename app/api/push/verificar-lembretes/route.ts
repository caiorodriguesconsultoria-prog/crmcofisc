import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { enviarPush } from "@/lib/push";

// Brasil não observa horário de verão desde 2019 — UTC-3 fixo é seguro aqui
// (mesma convenção usada em lib/google-calendar.ts).
function agoraBrasilia() {
  return new Date(Date.now() - 3 * 60 * 60 * 1000);
}

// Decide o período pelo horário real de Brasília no momento em que a rota
// roda — não por qual agendamento nominal disparou. O GitHub Actions (usado
// antes) atrasava horas o disparo do cron, e um disparo da manhã atrasado
// até quase meio-dia ainda dizia "tarefa da manhã" horas depois de fato.
// Assim a rota se autocorrige mesmo com atraso pequeno (o Vercel Cron é bem
// mais pontual, mas continua sendo o jeito certo de decidir isso).
function periodoAgora(): "manha" | "tarde" {
  return agoraBrasilia().getUTCHours() < 12 ? "manha" : "tarde";
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
// vercel.json) — dispara UM push só, juntando todas as tarefas do período
// que ainda não foram avisadas. Sem reenvio automático: se não foi
// resolvida, só volta a avisar se alguém reagendar a tarefa manualmente
// (o que zera lembrete_enviado — ver checklist.tsx).
async function executar(request: NextRequest) {
  if (!autorizado(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Só pra teste manual (?periodo=manha) — o disparo normal do Cron não
  // manda esse parâmetro, a rota decide sozinha pelo horário real.
  const periodoForcado = request.nextUrl.searchParams.get("periodo");
  const periodo = periodoForcado === "manha" || periodoForcado === "tarde" ? periodoForcado : periodoAgora();

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
    return NextResponse.json({ ok: true, periodo, enviados: 0 });
  }

  await supabase
    .from("processo_tarefas")
    .update({ lembrete_enviado: true })
    .in("id", tarefas.map((t) => t.id));

  const nomePeriodo = periodo === "manha" ? "manhã" : "tarde";
  const itens = tarefas.map((t: any) => `CT ${t.processos?.numero_contrato ?? "?"} - ${t.label}`);
  // Notificação push mostra só umas poucas linhas do corpo — em vez de
  // deixar cortar no meio de uma tarefa (parecendo incompleto), resume com
  // "e mais N" quando tem muitas.
  const LIMITE_LINHAS = 4;
  const corpo =
    itens.length > LIMITE_LINHAS
      ? [...itens.slice(0, LIMITE_LINHAS), `e mais ${itens.length - LIMITE_LINHAS}...`].join("\n")
      : itens.join("\n");
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

  return NextResponse.json({ ok: true, periodo, enviados, itensNaMensagem: tarefas.length });
}

// Vercel Cron sempre chama via GET.
export async function GET(request: NextRequest) {
  return executar(request);
}

// Mantido pra quem quiser disparar manualmente (curl, etc.) com POST.
export async function POST(request: NextRequest) {
  return executar(request);
}
