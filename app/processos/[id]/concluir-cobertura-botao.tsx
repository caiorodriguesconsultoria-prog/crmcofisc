"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cor } from "@/lib/theme";

export default function ConcluirCoberturaBotao({
  processoId,
  titularId,
}: {
  processoId: string;
  titularId: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function concluir() {
    setErro(null);
    setCarregando(true);
    const { error } = await supabase
      .from("processos")
      .update({ responsavel_atual_id: titularId, motivo_backup: null })
      .eq("id", processoId);
    setCarregando(false);
    if (error) {
      setErro(error.message);
      return;
    }
    router.refresh();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <button
        onClick={concluir}
        disabled={carregando}
        style={{
          fontSize: 11.5,
          fontWeight: 600,
          padding: "5px 12px",
          borderRadius: 20,
          border: "none",
          color: cor.atencao,
          background: "rgba(182,130,53,.12)",
        }}
      >
        {carregando ? "..." : "Concluir cobertura de férias"}
      </button>
      {erro && <span style={{ fontSize: 10.5, color: cor.urgente }}>{erro}</span>}
    </div>
  );
}
