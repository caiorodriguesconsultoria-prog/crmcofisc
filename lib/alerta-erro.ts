import { createServiceClient } from "@/lib/supabase/service";
import { enviarPush } from "@/lib/push";

const SISTEMA = "CRM-COFISC";

// Brasil não observa horário de verão desde 2019 — mesma convenção usada em
// app/api/push/verificar-lembretes/route.ts.
function horarioBrasilia() {
  return new Date(Date.now() - 3 * 60 * 60 * 1000).toLocaleString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Avisa quem é admin, no celular, quando um erro acontece de verdade —
// linguagem simples (não é o stack trace técnico, esse fica só no Sentry) e
// já identifica o sistema, pra quando existirem outros sistemas rodando ao
// mesmo tempo dar pra saber qual caiu só de olhar a notificação.
export async function notificarErroAdmins(contexto: string, mensagemTecnica: string) {
  try {
    const supabase = createServiceClient();
    const { data: admins } = await supabase
      .from("pessoas")
      .select("id, push_subscriptions(endpoint, p256dh, auth)")
      .eq("is_admin", true)
      .eq("ativo", true);

    if (!admins || admins.length === 0) return;

    const titulo = `🔴 ${SISTEMA}: algo quebrou`;
    const corpo =
      `Aconteceu um erro em "${contexto}" às ${horarioBrasilia()}. ` +
      `O que fazer: abra o Sentry pra ver o detalhe técnico e decidir a correção.\n\n` +
      `Mensagem: ${mensagemTecnica.slice(0, 150)}`;

    for (const admin of admins as any[]) {
      for (const sub of admin.push_subscriptions ?? []) {
        try {
          await enviarPush(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            { titulo, corpo, url: "/dashboard" },
          );
        } catch {
          // uma inscrição inválida não pode travar o aviso pros outros admins
        }
      }
    }
  } catch {
    // notificar sobre um erro nunca pode, ele mesmo, causar outro erro
  }
}
