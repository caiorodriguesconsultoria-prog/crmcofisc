import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose/jwt/verify";

const jwtSecret = process.env.SUPABASE_JWT_SECRET
  ? new TextEncoder().encode(process.env.SUPABASE_JWT_SECRET)
  : null;

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

  if (jwtSecret) {
    // getSession() lê da sessão local (cookie) e só faz chamada de rede se o
    // token estiver perto de expirar (renovação via refresh token) — no caso
    // comum, não tem round-trip pro Supabase.
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session) {
      try {
        // valida a assinatura do token localmente, sem round-trip pro Supabase
        // — mesma garantia criptográfica que getUser() checaria no servidor.
        await jwtVerify(session.access_token, jwtSecret, { algorithms: ["HS256"] });
      } catch {
        // token inválido/adulterado: derruba a sessão pra nenhuma página aceitá-la
        for (const cookie of request.cookies.getAll()) {
          if (cookie.name.startsWith("sb-") && cookie.name.includes("-auth-token")) {
            response.cookies.delete(cookie.name);
          }
        }
      }
    }
  } else {
    // SUPABASE_JWT_SECRET não configurado: mantém a checagem via rede,
    // que já revalida a sessão de verdade a cada requisição.
    await supabase.auth.getUser();
  }

  return response;
}
