self.addEventListener("push", (event) => {
  const dados = event.data ? event.data.json() : {};
  const titulo = dados.titulo || "CRM-COFISC";

  event.waitUntil(
    self.registration.showNotification(titulo, {
      body: dados.corpo || "",
      icon: "/icon-192",
      badge: "/icon-192",
      requireInteraction: true,
      data: { url: dados.url || "/dashboard" },
      // Botão próprio pra abrir o app — clicar no corpo da notificação só
      // fecha ela (deixa o texto expandido visível até lá), sem navegar
      // sozinho. Nem todo navegador mostra esse botão (iOS Safari, por
      // exemplo, não suporta); onde não suporta, o clique no corpo abre o
      // app direto, senão não sobraria nenhum jeito de abrir por lá.
      actions: [{ action: "abrir", title: "Abrir CRM" }],
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  const url = event.notification.data?.url || "/dashboard";
  const suportaAcoes = "actions" in Notification.prototype;

  if (event.action === "abrir" || (!event.action && !suportaAcoes)) {
    event.notification.close();
    event.waitUntil(clients.openWindow(url));
    return;
  }

  // Clique no corpo (sem ação) em navegador com suporte a botão: só fecha,
  // sem navegar — a lista do dia já ficou visível no texto expandido.
  event.notification.close();
});
