"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cor } from "@/lib/theme";

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
    <section style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <strong>Checklist</strong>
      {grupos.map((g) => {
        const concluidas = g.tarefas.filter((t) => t.concluida).length;
        const percentual = g.tarefas.length ? Math.round((concluidas / g.tarefas.length) * 100) : 0;
        return (
          <div key={g.origemId} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12.5, fontWeight: 600 }}>
                {g.origemTipo === "kanban" ? "Etapa" : "Evento"}: {g.nome}
              </span>
              <div style={{ flex: 1, height: 4, borderRadius: 2, background: "rgba(32,31,29,.10)" }}>
                <div
                  style={{
                    height: "100%",
                    borderRadius: 2,
                    background: cor.positivo,
                    width: `${percentual}%`,
                  }}
                />
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: cor.textoTerciario, whiteSpace: "nowrap" }}>
                {concluidas}/{g.tarefas.length}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {g.tarefas.map((t) => (
                <div
                  key={t.id}
                  onClick={() => (carregando ? null : alternar(t))}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    borderRadius: 10,
                    padding: "7px 8px",
                    cursor: carregando === t.id ? "default" : "pointer",
                    opacity: carregando === t.id ? 0.6 : 1,
                    background: t.concluida ? "rgba(126,155,126,.08)" : "transparent",
                  }}
                >
                  <span
                    style={{
                      flex: "none",
                      width: 18,
                      height: 18,
                      borderRadius: 6,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#fff",
                      background: t.concluida ? cor.positivo : "rgba(32,31,29,.18)",
                    }}
                  >
                    {t.concluida ? "✓" : ""}
                  </span>
                  <span
                    style={{
                      fontSize: 12.5,
                      textDecoration: t.concluida ? "line-through" : "none",
                      color: t.concluida ? cor.textoTerciario : cor.texto,
                    }}
                  >
                    {t.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
      {erro && <p style={{ color: cor.urgente, margin: 0 }}>{erro}</p>}
    </section>
  );
}
