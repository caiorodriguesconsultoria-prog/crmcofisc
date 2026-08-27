"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { cor } from "@/lib/theme";

type HistoricoKanban = { kanban: string; entrada_em: string; saida_em: string | null };
type HistoricoEvento = { inicio_em: string; fim_em: string | null; tags: { valor: string } | null };
type TarefaConcluida = { id: string; texto: string; data: string };

export default function HistoricoLazy({ processoId }: { processoId: string }) {
  const [dados, setDados] = useState<{
    kanban: HistoricoKanban[];
    eventos: HistoricoEvento[];
    tarefasConcluidas: TarefaConcluida[];
  } | null>(null);

  useEffect(() => {
    let ativo = true;
    const supabase = createClient();
    Promise.all([
      supabase
        .from("processo_kanban_historico")
        .select("kanban, entrada_em, saida_em")
        .eq("processo_id", processoId)
        .order("entrada_em", { ascending: false }),
      supabase
        .from("processo_tag_historico")
        .select("inicio_em, fim_em, tags(valor)")
        .eq("processo_id", processoId)
        .order("inicio_em", { ascending: false }),
      supabase
        .from("andamentos")
        .select("id, texto, data")
        .eq("processo_id", processoId)
        .eq("tipo", "Tarefa concluída")
        .order("data", { ascending: false }),
    ]).then(([{ data: kanban }, { data: eventos }, { data: tarefasConcluidas }]) => {
      if (ativo)
        setDados({
          kanban: (kanban ?? []) as any,
          eventos: (eventos ?? []) as any,
          tarefasConcluidas: (tarefasConcluidas ?? []) as any,
        });
    });
    return () => {
      ativo = false;
    };
  }, [processoId]);

  if (!dados) {
    return <p style={{ fontSize: 12, color: cor.textoTerciario }}>Carregando…</p>;
  }

  return (
    <>
      <div>
        <strong style={{ fontSize: 12.5 }}>Kanban</strong>
        <ul style={{ margin: "6px 0 0", paddingLeft: 20, fontSize: 13 }}>
          {dados.kanban.map((h, i) => (
            <li key={i}>
              {h.kanban} — entrada {new Date(h.entrada_em).toLocaleString("pt-BR")}
              {h.saida_em ? `, saída ${new Date(h.saida_em).toLocaleString("pt-BR")}` : " (atual)"}
            </li>
          ))}
        </ul>
      </div>

      <div style={{ marginTop: 14 }}>
        <strong style={{ fontSize: 12.5 }}>Eventos</strong>
        <ul style={{ margin: "6px 0 0", paddingLeft: 20, fontSize: 13 }}>
          {dados.eventos.length === 0 && <li style={{ color: cor.textoTerciario }}>Nenhum registro ainda.</li>}
          {dados.eventos.map((h, i) => (
            <li key={i}>
              {h.tags?.valor} — início {new Date(h.inicio_em).toLocaleString("pt-BR")}
              {h.fim_em ? `, fim ${new Date(h.fim_em).toLocaleString("pt-BR")}` : " (ativo)"}
            </li>
          ))}
        </ul>
      </div>

      <div style={{ marginTop: 14 }}>
        <strong style={{ fontSize: 12.5 }}>Tarefas concluídas</strong>
        <ul style={{ margin: "6px 0 0", paddingLeft: 20, fontSize: 13 }}>
          {dados.tarefasConcluidas.length === 0 && (
            <li style={{ color: cor.textoTerciario }}>Nenhuma tarefa concluída ainda.</li>
          )}
          {dados.tarefasConcluidas.map((t) => (
            <li key={t.id}>
              {t.texto} — {new Date(t.data).toLocaleString("pt-BR")}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
