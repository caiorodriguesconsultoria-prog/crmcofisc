import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

function escapeHtml(texto: string) {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function pagina(titulo: string, corpo: string) {
  return new NextResponse(
    `<!doctype html><html><head><meta charset="utf-8"><title>${titulo}</title>
      <style>
        body{font-family:system-ui,sans-serif;max-width:640px;margin:48px auto;padding:0 16px;color:#222}
        code{background:#f2f2f2;padding:12px;display:block;border-radius:8px;word-break:break-all;font-size:14px}
        .aviso{background:#FFF4E5;border:1px solid #E8B84B;padding:12px;border-radius:8px;margin-top:16px}
      </style>
    </head><body>${corpo}</body></html>`,
    { headers: { "content-type": "text/html; charset=utf-8" }, status: 200 },
  );
}

// Não guarda nada no banco — só exibe o refresh_token uma vez, pra você
// copiar direto pro secret GOOGLE_DRIVE_REFRESH_TOKEN no GitHub. Depois
// que você fechar essa página, ele não aparece de novo (precisaria repetir
// o /api/google/drive-auth, que sempre força um novo consentimento).
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  const { data: pessoa } = await supabase
    .from("pessoas")
    .select("is_admin")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (!pessoa?.is_admin) return NextResponse.redirect(new URL("/agenda", request.url));

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const erro = url.searchParams.get("error");

  if (erro || !code) {
    return pagina("Erro", `<h1>Erro na autorização</h1><p>${escapeHtml(erro ?? "código não recebido")}</p>`);
  }

  const redirectUri = new URL("/api/google/drive-callback", request.url).toString();
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
    const texto = await resposta.text();
    return pagina("Erro", `<h1>Erro ao trocar o código</h1><code>${escapeHtml(texto)}</code>`);
  }

  const dados = await resposta.json();
  if (!dados.refresh_token) {
    return pagina(
      "Erro",
      `<h1>Não veio refresh_token</h1><p>O Google só manda na primeira autorização. Revogue o acesso em <a href="https://myaccount.google.com/permissions">myaccount.google.com/permissions</a> e tente de novo.</p>`,
    );
  }

  return pagina(
    "Token do Drive",
    `<h1>Copie este valor</h1>
     <p>Este é o secret <b>GOOGLE_DRIVE_REFRESH_TOKEN</b> no GitHub (Settings → Secrets and variables → Actions). Copie agora — essa página não guarda nada e não mostra de novo.</p>
     <code>${escapeHtml(dados.refresh_token)}</code>
     <div class="aviso">Depois de copiar e salvar no GitHub, pode fechar esta aba.</div>`,
  );
}
