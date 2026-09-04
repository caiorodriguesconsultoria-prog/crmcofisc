import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Recebe o redirect do Supabase Auth depois do login via Google (fluxo
// OAuth do próprio Supabase, separado da conexão com a Calendar API em
// /api/google/*) e troca o "code" pela sessão, gravando os cookies.
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(new URL("/login?erro=google", request.url));
    }
  }

  return NextResponse.redirect(new URL("/dashboard", request.url));
}
