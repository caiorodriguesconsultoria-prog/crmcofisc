import webpush from "web-push";

let configurado = false;
function garantirConfigurado() {
  if (configurado) return;
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_CONTATO_EMAIL ?? "contato@example.com"}`,
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
  configurado = true;
}

export async function enviarPush(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: { titulo: string; corpo: string; url?: string },
) {
  garantirConfigurado();
  return webpush.sendNotification(subscription as any, JSON.stringify(payload));
}
