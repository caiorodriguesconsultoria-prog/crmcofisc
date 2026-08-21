"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function formatarData(data: string | null) {
  return data ? new Date(`${data}T00:00:00`).toLocaleDateString("pt-BR") : "não informado";
}

export default function Prazo({
  processoId,
  prazoData,
}: {
  processoId: string;
  prazoData: string | null;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(prazoData ?? "");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    setErro(null);
    setSalvando(true);
    const { error } = await supabase
      .from("processos")
      .update({ prazo_data: valor || null })
      .eq("id", processoId);
    setSalvando(false);
    if (error) {
      setErro(error.message);
      return;
    }
    setEditando(false);
    router.refresh();
  }

  if (!editando) {
    return (
      <div style={{ marginTop: 16 }}>
        <strong>Prazo</strong>
        <p style={{ margin: "4px 0" }}>
          {formatarData(prazoData)} <button onClick={() => setEditando(true)}>Editar</button>
        </p>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 16 }}>
      <strong>Prazo</strong>
      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <input
          type="date"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          style={{ padding: 6 }}
        />
        <button onClick={salvar} disabled={salvando}>
          Salvar
        </button>
        <button onClick={() => setEditando(false)} disabled={salvando}>
          Cancelar
        </button>
      </div>
      {erro && <p style={{ color: "#B0655C" }}>{erro}</p>}
    </div>
  );
}
