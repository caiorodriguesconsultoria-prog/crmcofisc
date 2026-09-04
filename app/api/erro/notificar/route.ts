import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { notificarErroAdmins } from "@/lib/alerta-erro";

// Chamada pelo global-error.tsx quando um erro estoura no navegador —
// erro do cliente nunca chega no onRequestError do servidor sozinho.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const corpo = await request.json().catch(() => ({}));
  const contexto =
    typeof corpo.contexto === "string" && corpo.contexto ? corpo.contexto.slice(0, 200) : "tela desconhecida";
  const mensagem =
    typeof corpo.mensagem === "string" && corpo.mensagem ? corpo.mensagem.slice(0, 500) : "sem mensagem";

  await notificarErroAdmins(contexto, mensagem);
  return NextResponse.json({ ok: true });
}
