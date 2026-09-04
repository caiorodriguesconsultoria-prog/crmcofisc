"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
    fetch("/api/erro/notificar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contexto: typeof window !== "undefined" ? window.location.pathname : "tela desconhecida",
        mensagem: error.message,
      }),
    }).catch(() => {
      // se nem o aviso conseguir sair, o Sentry acima já registrou o erro
    });
  }, [error]);

  return (
    <html lang="pt-BR">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: 32 }}>
        <h1 style={{ fontSize: 20 }}>Algo deu errado</h1>
        <p>O erro foi registrado. Tente recarregar a página.</p>
      </body>
    </html>
  );
}
