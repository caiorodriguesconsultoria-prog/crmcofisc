"use client";

import { useEffect, useState } from "react";
import { cor } from "@/lib/theme";

// Chave pública do par VAPID — não é segredo (o navegador precisa dela pra
// criar a inscrição de push), por isso fica direto no código em vez de
// variável de ambiente. A chave PRIVADA (VAPID_PRIVATE_KEY) é que fica só
// no servidor, essa sim nunca aparece aqui.
const VAPID_PUBLIC_KEY =
  "BOmPBiH4OW_mEgtX4uad2E7CCadhl8ZRA-AZSBDQ60kWCBFEz1CE36u1jPywxERnyitlG6fUegjn8farRAlNgro";

function urlBase64ParaUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export default function NotificacoesPush() {
  const [suportado, setSuportado] = useState(false);
  const [inscrito, setInscrito] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    setSuportado(true);
    navigator.serviceWorker.register("/sw.js").then(async (registro) => {
      const subscription = await registro.pushManager.getSubscription();
      setInscrito(!!subscription);
    });
  }, []);

  async function ativar() {
    setErro(null);
    setCarregando(true);
    try {
      const permissao = await Notification.requestPermission();
      if (permissao !== "granted") {
        setErro("Permissão de notificação negada.");
        return;
      }
      const registro = await navigator.serviceWorker.ready;
      const subscription = await registro.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ParaUint8Array(VAPID_PUBLIC_KEY),
      });
      const json = subscription.toJSON();
      const resposta = await fetch("/api/push/inscrever", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
      });
      if (!resposta.ok) {
        const dados = await resposta.json();
        setErro(dados.error ?? "Erro ao ativar notificações");
        return;
      }
      setInscrito(true);
    } catch {
      setErro("Erro ao ativar notificações");
    } finally {
      setCarregando(false);
    }
  }

  async function desativar() {
    setErro(null);
    setCarregando(true);
    try {
      const registro = await navigator.serviceWorker.ready;
      const subscription = await registro.pushManager.getSubscription();
      if (subscription) {
        await fetch("/api/push/inscrever", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }
      setInscrito(false);
    } catch {
      setErro("Erro ao desativar notificações");
    } finally {
      setCarregando(false);
    }
  }

  if (!suportado) return null;

  return (
    <div style={{ padding: "8px 8px 4px" }}>
      <button
        type="button"
        onClick={inscrito ? desativar : ativar}
        disabled={carregando}
        style={{
          width: "100%",
          fontSize: 12,
          fontWeight: 600,
          padding: "8px 10px",
          borderRadius: 10,
          border: `1px solid ${cor.borda}`,
          background: inscrito ? cor.destaqueFundo : "transparent",
          color: inscrito ? cor.destaque : cor.textoSecundario,
        }}
      >
        {carregando ? "..." : inscrito ? "🔔 Notificações ativas" : "🔕 Ativar notificações"}
      </button>
      {erro && <p style={{ fontSize: 10.5, color: cor.urgente, margin: "4px 2px 0" }}>{erro}</p>}
    </div>
  );
}
