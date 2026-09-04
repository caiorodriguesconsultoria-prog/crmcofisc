import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" || process.env.NEXT_RUNTIME === "edge") {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      tracesSampleRate: 0,
      // Toda captura já sai marcada com o sistema — importante quando existir
      // mais de um sistema rodando, pra saber qual caiu só de olhar o Sentry.
      initialScope: { tags: { sistema: "CRM-COFISC" } },
    });
  }
}

export async function onRequestError(
  error: unknown,
  request: { path: string; method: string; headers: Record<string, string> },
  context: { routerKind: string; routePath: string; routeType: string },
) {
  Sentry.captureRequestError(error, request, context);
  // web-push (usado pelo alerta) depende de módulos só do Node — import
  // dinâmico e condicionado ao runtime pra não quebrar o bundle do edge
  // (o middleware roda em edge, e o Next compila onRequestError pros dois).
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { notificarErroAdmins } = await import("@/lib/alerta-erro");
    const rota = context?.routePath || request?.path || "rota desconhecida";
    const mensagem = error instanceof Error ? error.message : String(error);
    await notificarErroAdmins(rota, mensagem);
  }
}
