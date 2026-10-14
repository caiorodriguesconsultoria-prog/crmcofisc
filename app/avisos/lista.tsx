"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { card, cor } from "@/lib/theme";

type Aviso = {
  id: string;
  contexto: string;
  mensagem: string;
  created_at: string;
  lido_em: string | null;
};

function formatarData(data: string) {
  return new Date(data).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export default function ListaAvisos({
  avisos,
  minhaPessoaId,
}: {
  avisos: Aviso[];
  minhaPessoaId: string | null;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [marcandoId, setMarcandoId] = useState<string | null>(null);

  const naoLidos = avisos.filter((a) => !a.lido_em).length;

  async function marcarComoLido(id: string) {
    setMarcandoId(id);
    await supabase
      .from("alertas_sistema")
      .update({ lido_em: new Date().toISOString(), lido_por: minhaPessoaId })
      .eq("id", id);
    setMarcandoId(null);
    router.refresh();
  }

  if (avisos.length === 0) {
    return <p style={{ color: cor.textoTerciario, fontSize: 13, marginTop: 20 }}>Nenhum aviso registrado ainda.</p>;
  }

  return (
    <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
      {naoLidos > 0 && (
        <p style={{ fontSize: 12.5, color: cor.urgente, fontWeight: 600, margin: 0 }}>
          {naoLidos} aviso{naoLidos > 1 ? "s" : ""} não lido{naoLidos > 1 ? "s" : ""}
        </p>
      )}
      {avisos.map((a) => {
        const lido = !!a.lido_em;
        return (
          <div
            key={a.id}
            style={{
              ...card,
              padding: "12px 14px",
              opacity: lido ? 0.6 : 1,
              borderLeft: lido ? undefined : `3px solid ${cor.urgente}`,
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
              <div style={{ minWidth: 0 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: cor.urgente, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  {a.contexto}
                </span>
                <p style={{ margin: "4px 0 0", fontSize: 13, overflowWrap: "break-word" }}>{a.mensagem}</p>
                <span style={{ fontSize: 11, color: cor.textoTerciario }}>{formatarData(a.created_at)}</span>
              </div>
              {!lido && (
                <button
                  type="button"
                  onClick={() => marcarComoLido(a.id)}
                  disabled={marcandoId === a.id}
                  style={{ fontSize: 11, padding: "5px 10px", flex: "none" }}
                >
                  {marcandoId === a.id ? "..." : "Marcar como lido"}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
