"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cor } from "@/lib/theme";
import { CampoLinha } from "@/app/_ui/campo";

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
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <strong>Prazo</strong>
        <CampoLinha
          label="Data limite"
          valor={formatarData(prazoData)}
          acao={
            <button onClick={() => setEditando(true)} style={{ fontSize: 11 }}>
              Editar
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <strong>Prazo</strong>
      <div style={{ display: "flex", gap: 8 }}>
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
      {erro && <p style={{ color: cor.urgente, margin: 0 }}>{erro}</p>}
    </div>
  );
}
