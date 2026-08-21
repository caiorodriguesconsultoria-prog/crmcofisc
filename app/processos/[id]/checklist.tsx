"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Tarefa = { id: string; label: string; concluida: boolean };
type Grupo = { origemId: string; origemTipo: string; nome: string; tarefas: Tarefa[] };

export default function Checklist({ grupos }: { grupos: Grupo[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState<string | null>(null);

  async function alternar(tarefa: Tarefa) {
    setErro(null);
    setCarregando(tarefa.id);
    const { error } = await supabase
      .from("processo_tarefas")
      .update({ concluida: !tarefa.concluida })
      .eq("id", tarefa.id);
    setCarregando(null);
    if (error) {
      setErro(error.message);
      return;
    }
    router.refresh();
  }

  if (grupos.length === 0) return null;

  return (
    <section style={{ marginTop: 16 }}>
      <strong>Checklist</strong>
      {grupos.map((g) => {
        const concluidas = g.tarefas.filter((t) => t.concluida).length;
        return (
          <div key={g.origemId} style={{ marginTop: 8 }}>
            <div style={{ fontSize: 13, color: "#605D5D" }}>
              {g.origemTipo === "kanban" ? "Etapa" : "Evento"}: {g.nome} — {concluidas}/
              {g.tarefas.length} tarefas
            </div>
            <ul style={{ listStyle: "none", padding: 0, marginTop: 4 }}>
              {g.tarefas.map((t) => (
                <li key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "3px 0" }}>
                  <input
                    type="checkbox"
                    checked={t.concluida}
                    disabled={carregando === t.id}
                    onChange={() => alternar(t)}
                  />
                  <span
                    style={{
                      textDecoration: t.concluida ? "line-through" : "none",
                      color: t.concluida ? "#7D7979" : "inherit",
                    }}
                  >
                    {t.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
      {erro && <p style={{ color: "#B0655C" }}>{erro}</p>}
    </section>
  );
}
