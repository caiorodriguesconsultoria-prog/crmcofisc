import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options: CookieOptions }[],
        ) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getSession() lê da sessão local (cookie) e só faz chamada de rede se o
  // token estiver perto de expirar (renovação via refresh token) — no caso
  // comum, não tem round-trip pro Supabase.
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    // getClaims() valida a assinatura do token — com as JWT Signing Keys
    // (chave assimétrica) do projeto, isso é feito localmente via cache de
    // JWKS, sem round-trip pro Supabase; só cai pra chamada de rede (getUser())
    // se o token ainda for do formato antigo (segredo simétrico legado).
    const { error } = await supabase.auth.getClaims(session.access_token);
    if (error) {
      // token inválido/expirado/adulterado: derruba a sessão pra nenhuma página aceitá-la
      for (const cookie of request.cookies.getAll()) {
        if (cookie.name.startsWith("sb-") && cookie.name.includes("-auth-token")) {
          response.cookies.delete(cookie.name);
        }
      }
    }
  }

  return response;
}
