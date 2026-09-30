"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cor } from "@/lib/theme";

export default function ConcluirContratoBotao({
  processoId,
  parecerDefinido,
}: {
  processoId: string;
  parecerDefinido: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState(false);

  async function concluir() {
    setErro(null);
    setCarregando(true);
    const { error } = await supabase.from("processos").update({ situacao: "concluido" }).eq("id", processoId);
    setCarregando(false);
    if (error) {
      setErro(error.message);
      return;
    }
    setConfirmando(false);
    router.refresh();
  }

  if (!parecerDefinido) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <button
          type="button"
          disabled
          title="Defina o parecer (Execução regular/irregular) em 'Concluir contrato' antes de concluir"
          style={{
            fontSize: 11.5,
            fontWeight: 600,
            padding: "5px 12px",
            borderRadius: 20,
            border: "none",
            color: cor.textoTerciario,
            background: "rgba(96,93,93,.10)",
            cursor: "not-allowed",
          }}
        >
          Concluir contrato
        </button>
      </div>
    );
  }

  if (confirmando) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 11.5, color: cor.textoSecundario }}>Confirma a conclusão?</span>
        <button
          type="button"
          onClick={concluir}
          disabled={carregando}
          style={{
            fontSize: 11.5,
            fontWeight: 600,
            padding: "5px 12px",
            borderRadius: 20,
            border: "none",
            color: "#fff",
            background: cor.positivo,
          }}
        >
          {carregando ? "..." : "Confirmar"}
        </button>
        <button
          type="button"
          onClick={() => setConfirmando(false)}
          disabled={carregando}
          style={{
            fontSize: 11.5,
            fontWeight: 600,
            padding: "5px 12px",
            borderRadius: 20,
            border: "none",
            color: cor.textoSecundario,
            background: "rgba(96,93,93,.10)",
          }}
        >
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <button
        type="button"
        onClick={() => setConfirmando(true)}
        style={{
          fontSize: 11.5,
          fontWeight: 600,
          padding: "5px 12px",
          borderRadius: 20,
          border: "none",
          color: cor.positivo,
          background: cor.positivoFundo,
        }}
      >
        Concluir contrato
      </button>
      {erro && <span style={{ fontSize: 10.5, color: cor.urgente }}>{erro}</span>}
    </div>
  );
}
