import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const erro = url.searchParams.get("error");

  if (erro || !code) {
    return NextResponse.redirect(new URL("/agenda?google=erro", request.url));
  }

  const redirectUri = new URL("/api/google/callback", request.url).toString();
  const resposta = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      code,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!resposta.ok) {
    return NextResponse.redirect(new URL("/agenda?google=erro", request.url));
  }

  const dados = await resposta.json();
  if (!dados.refresh_token) {
    // O Google só manda refresh_token na primeira autorização (ou quando
    // prompt=consent força reconsentimento) — chegar aqui sem ele indica
    // que algo no fluxo pulou essa etapa.
    return NextResponse.redirect(new URL("/agenda?google=sem-refresh-token", request.url));
  }

  const supabase = createServiceClient();
  const expiraEm = new Date(Date.now() + dados.expires_in * 1000).toISOString();
  await supabase.from("google_calendar_tokens").upsert({
    id: 1,
    refresh_token: dados.refresh_token,
    access_token: dados.access_token,
    access_token_expira_em: expiraEm,
    updated_at: new Date().toISOString(),
  });

  return NextResponse.redirect(new URL("/agenda?google=conectado", request.url));
}
