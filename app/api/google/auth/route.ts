import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Só admin pode conectar/reconectar a conta do Google que o sistema usa
// pra criar os eventos — é uma conexão única, compartilhada por todo mundo.
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

  const redirectUri = new URL("/api/google/callback", request.url).toString();
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID ?? "",
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/calendar.events",
    access_type: "offline",
    prompt: "consent",
  });

  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}
