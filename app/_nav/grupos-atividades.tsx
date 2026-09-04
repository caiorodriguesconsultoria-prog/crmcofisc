"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cor } from "@/lib/theme";
import type { Atividade } from "./sidebar";

function Grupo({
  titulo,
  itens,
  removivel,
  tipoNovo,
}: {
  titulo: string;
  itens: Atividade[];
  removivel?: boolean;
  tipoNovo?: "etapa" | "evento";
}) {
  const router = useRouter();
  const supabase = createClient();
  const [aberto, setAberto] = useState(false);
  const [removendoId, setRemovendoId] = useState<string | null>(null);
  const [criandoNovo, setCriandoNovo] = useState(false);
  const [nomeNovo, setNomeNovo] = useState("");
  const [corNovo, setCorNovo] = useState("#2F5FDB");
  const [salvandoNovo, setSalvandoNovo] = useState(false);
  const total = itens.reduce((soma, a) => soma + a.count, 0);

  async function removerTag(id: string) {
    if (!confirm("Apagar este evento? Ele some de todos os processos que o usam.")) return;
    setRemovendoId(id);
    await supabase.from("tags").delete().eq("id", id);
    setRemovendoId(null);
    router.refresh();
  }

  async function criarNovo() {
    if (!nomeNovo.trim()) return;
    setSalvandoNovo(true);
    if (tipoNovo === "etapa") {
      await supabase.from("kanban_colunas").insert({ nome: nomeNovo.trim(), ordem: itens.length });
    } else if (tipoNovo === "evento") {
      await supabase.from("tags").insert({ categoria: "evento", valor: nomeNovo.trim(), ativo: true, cor: corNovo });
    }
    setSalvandoNovo(false);
    setNomeNovo("");
    setCriandoNovo(false);
    router.refresh();
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setAberto((a) => !a)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: 10.5,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: 1,
          color: cor.textoTerciario,
          padding: "10px 12px",
          margin: "6px 0 0",
          border: "none",
          background: "transparent",
        }}
      >
        <span style={{ fontSize: 9, transform: aberto ? "rotate(90deg)" : "none", transition: "transform .15s" }}>▸</span>
        {titulo}
        <span style={{ marginLeft: "auto", fontWeight: 600 }}>{total}</span>
      </button>
      {aberto && (
        <div>
          {itens.map((a) => (
            <div key={a.label} style={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Link
                href={a.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 12.5,
                  fontWeight: 500,
                  padding: "7px 12px",
                  borderRadius: 10,
                  color: cor.texto,
                  textDecoration: "none",
                  flex: 1,
                  minWidth: 0,
                }}
              >
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: a.dot, flex: "none" }} />
                <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {a.label}
                </span>
                <span style={{ fontSize: 11.5, fontWeight: 600, color: cor.textoTerciario, flex: "none", width: 16, textAlign: "right" }}>
                  {a.count}
                </span>
              </Link>
              {removivel && a.id && (
                <button
                  type="button"
                  onClick={() => removerTag(a.id!)}
                  disabled={removendoId === a.id}
                  aria-label={`Apagar ${a.label}`}
                  title="Apagar evento"
                  style={{
                    flex: "none",
                    width: 20,
                    height: 20,
                    padding: 0,
                    marginRight: 8,
                    fontSize: 11,
                    border: "none",
                    borderRadius: 6,
                    color: cor.textoTerciario,
                    background: "rgba(96,93,93,.10)",
                  }}
                >
                  ×
                </button>
              )}
            </div>
          ))}
          {tipoNovo &&
            (criandoNovo ? (
              <div style={{ display: "flex", gap: 4, padding: "4px 12px 6px" }}>
                <input
                  autoFocus
                  value={nomeNovo}
                  onChange={(e) => setNomeNovo(e.target.value)}
                  placeholder={tipoNovo === "etapa" ? "Nome da etapa" : "Nome do evento"}
                  style={{ padding: 6, fontSize: 12, flex: 1, minWidth: 0 }}
                />
                {tipoNovo === "evento" && (
                  <input
                    type="color"
                    value={corNovo}
                    onChange={(e) => setCorNovo(e.target.value)}
                    title="Cor do evento"
                    style={{ width: 30, padding: 1, flex: "none" }}
                  />
                )}
                <button
                  type="button"
                  onClick={criarNovo}
                  disabled={salvandoNovo || !nomeNovo.trim()}
                  style={{ fontSize: 11, padding: "4px 8px", flex: "none" }}
                >
                  Criar
                </button>
                <button
                  type="button"
                  onClick={() => { setCriandoNovo(false); setNomeNovo(""); }}
                  style={{ fontSize: 11, padding: "4px 8px", flex: "none" }}
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setCriandoNovo(true)}
                style={{
                  display: "block",
                  width: "calc(100% - 8px)",
                  margin: "2px 4px",
                  fontSize: 11.5,
                  fontWeight: 600,
                  padding: "6px 12px",
                  border: "none",
                  borderRadius: 8,
                  background: "transparent",
                  color: cor.textoTerciario,
                  textAlign: "left",
                }}
              >
                {tipoNovo === "etapa" ? "+ Nova Etapa" : "+ Novo Evento"}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

export default function GruposAtividades({
  atividades,
  eventos,
  ehAdmin,
}: {
  atividades: Atividade[];
  eventos: Atividade[];
  ehAdmin: boolean;
}) {
  return (
    <>
      {atividades.length > 0 && <Grupo titulo="Atividades" itens={atividades} tipoNovo="etapa" />}
      {eventos.length > 0 && <Grupo titulo="Eventos" itens={eventos} removivel={ehAdmin} tipoNovo="evento" />}
    </>
  );
}
