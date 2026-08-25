import { createServiceClient } from "@/lib/supabase/service";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const EVENTS_URL = "https://www.googleapis.com/calendar/v3/calendars/primary/events";

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
  const accessToken = await obterAccessToken();
  if (!accessToken) return;
  await fetch(`${EVENTS_URL}/${googleEventId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}
