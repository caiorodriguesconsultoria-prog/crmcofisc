import { createServiceClient } from "@/lib/supabase/service";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const EVENTS_URL = "https://www.googleapis.com/calendar/v3/calendars/primary/events";
const TASKS_URL = "https://tasks.googleapis.com/tasks/v1/lists/@default/tasks";

// google_event_id vem do cliente (via /api/google/sync) e é concatenado na
// URL da chamada pro Google — id de evento de verdade nunca tem esses
// caracteres, então isso barra qualquer tentativa de manipular a URL.
function idDeEventoValido(id: string): boolean {
  return /^[A-Za-z0-9_-]{1,1024}$/.test(id);
}

async function obterAccessToken(): Promise<string | null> {
  const supabase = createServiceClient();
  const { data: registro } = await supabase
    .from("google_calendar_tokens")
    .select("refresh_token, access_token, access_token_expira_em")
    .eq("id", 1)
    .maybeSingle();
  if (!registro) return null;

  const expiraEm = registro.access_token_expira_em ? new Date(registro.access_token_expira_em).getTime() : 0;
  if (registro.access_token && expiraEm > Date.now() + 60_000) {
    return registro.access_token;
  }

  const resposta = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      refresh_token: registro.refresh_token,
      grant_type: "refresh_token",
    }),
  });
  if (!resposta.ok) return null;
  const dados = await resposta.json();
  const expiraEmNovo = new Date(Date.now() + dados.expires_in * 1000).toISOString();
  await supabase
    .from("google_calendar_tokens")
    .update({ access_token: dados.access_token, access_token_expira_em: expiraEmNovo, updated_at: new Date().toISOString() })
    .eq("id", 1);
  return dados.access_token as string;
}

export async function googleConectado(): Promise<boolean> {
  const supabase = createServiceClient();
  const { data } = await supabase.from("google_calendar_tokens").select("id").eq("id", 1).maybeSingle();
  return !!data;
}

// Brasil não observa horário de verão desde 2019 — UTC-3 fixo é seguro aqui.
function paraDataHoraUtc(data: string, horario: string) {
  const [ano, mes, dia] = data.split("-").map(Number);
  const [hora, minuto] = horario.split(":").map(Number);
  return new Date(Date.UTC(ano, mes - 1, dia, hora + 3, minuto));
}

export async function criarOuAtualizarEventoGoogle(params: {
  googleEventId: string | null;
  resumo: string;
  data: string;
  horario: string;
  url: string;
}): Promise<string | null> {
  const accessToken = await obterAccessToken();
  if (!accessToken) return null;

  const inicio = paraDataHoraUtc(params.data, params.horario);
  const fim = new Date(inicio.getTime() + 30 * 60 * 1000);
  const body = {
    summary: params.resumo,
    description: params.url,
    start: { dateTime: inicio.toISOString() },
    end: { dateTime: fim.toISOString() },
  };

  if (params.googleEventId && !idDeEventoValido(params.googleEventId)) return null;
  const metodo = params.googleEventId ? "PATCH" : "POST";
  const endpoint = params.googleEventId ? `${EVENTS_URL}/${params.googleEventId}` : EVENTS_URL;

  const resposta = await fetch(endpoint, {
    method: metodo,
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!resposta.ok) return null;
  const dados = await resposta.json();
  return (dados.id as string) ?? null;
}

export async function removerEventoGoogle(googleEventId: string): Promise<void> {
  if (!idDeEventoValido(googleEventId)) return;
  const accessToken = await obterAccessToken();
  if (!accessToken) return;
  await fetch(`${EVENTS_URL}/${googleEventId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

// Tarefas viram Google Tasks, não eventos de Calendar — aparecem na lista
// "Tarefas" do próprio Calendar (painel lateral), em vez de um bloco de
// horário que empilha em cima de outros quando várias caem no mesmo
// horário. A API de Tasks do Google não guarda hora, só data (o horário
// digitado no CRM fica só aqui dentro, não vai pro Google).
export async function criarOuAtualizarTarefaGoogle(params: {
  googleTaskId: string | null;
  titulo: string;
  notas: string;
  data: string;
}): Promise<string | null> {
  const accessToken = await obterAccessToken();
  if (!accessToken) return null;

  const body = {
    title: params.titulo,
    notes: params.notas,
    due: `${params.data}T00:00:00.000Z`,
  };

  if (params.googleTaskId && !idDeEventoValido(params.googleTaskId)) return null;
  const metodo = params.googleTaskId ? "PATCH" : "POST";
  const endpoint = params.googleTaskId ? `${TASKS_URL}/${params.googleTaskId}` : TASKS_URL;

  const resposta = await fetch(endpoint, {
    method: metodo,
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!resposta.ok) return null;
  const dados = await resposta.json();
  return (dados.id as string) ?? null;
}

export async function removerTarefaGoogle(googleTaskId: string): Promise<void> {
  if (!idDeEventoValido(googleTaskId)) return;
  const accessToken = await obterAccessToken();
  if (!accessToken) return;
  await fetch(`${TASKS_URL}/${googleTaskId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

// Ao concluir uma tarefa no CRM, a Google Task correspondente não é apagada
// — só ganha um "✅ " na frente do título, pra continuar visível na lista de
// Tarefas do Calendar em vez de sumir. Reversível: reabrir a tarefa tira o
// prefixo de volta. Só tarefa recebe esse check — entrega (execução do
// cronograma) não sincroniza com o Google.
export async function marcarConclusaoTarefaGoogle(params: {
  googleTaskId: string;
  tituloBase: string;
  concluida: boolean;
}): Promise<void> {
  if (!idDeEventoValido(params.googleTaskId)) return;
  const accessToken = await obterAccessToken();
  if (!accessToken) return;
  await fetch(`${TASKS_URL}/${params.googleTaskId}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ title: params.concluida ? `✅ ${params.tituloBase}` : params.tituloBase }),
  });
}
