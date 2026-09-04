"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { botaoPrimario, card, cor } from "@/lib/theme";
import { BotaoCopiar } from "@/app/_ui/campo";
import Painel from "@/app/_ui/painel";

type Item = { id: string; nome: string; matricula: string | null };

export default function ListaPessoasPapel({
  titulo,
  papel,
  novoHref,
  isAdmin,
  itens,
  erro,
}: {
  titulo: string;
  papel: "gestor" | "fiscal";
  novoHref: string;
  isAdmin: boolean;
  itens: Item[];
  erro?: string;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [editando, setEditando] = useState<Item | null>(null);
  const [nome, setNome] = useState("");
  const [matricula, setMatricula] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erroForm, setErroForm] = useState<string | null>(null);
  const [excluindoId, setExcluindoId] = useState<string | null>(null);

  function abrirEdicao(item: Item) {
    setEditando(item);
    setNome(item.nome);
    setMatricula(item.matricula ?? "");
    setErroForm(null);
  }

  async function salvarEdicao(e: React.FormEvent) {
    e.preventDefault();
    if (!editando) return;
    setErroForm(null);
    setSalvando(true);
    const { error } = await supabase
      .from("pessoas")
      .update({ nome, matricula })
      .eq("id", editando.id);
    setSalvando(false);
    if (error) {
      setErroForm(error.message);
      return;
    }
    setEditando(null);
    router.refresh();
  }

  async function excluir(item: Item) {
    if (!window.confirm(`Remover ${item.nome} da lista de ${titulo.toLowerCase()}?`)) return;
    setExcluindoId(item.id);
    const { error } = await supabase
      .from("pessoa_papeis")
      .delete()
      .eq("pessoa_id", item.id)
      .eq("papel", papel);
    setExcluindoId(null);
    if (error) {
      window.alert(error.message);
      return;
    }
    router.refresh();
  }

  return (
    <Painel
      titulo={titulo}
      voltarHref="/dashboard"
      maxWidth={900}
      acao={
        isAdmin && (
          <Link href={novoHref} style={{ ...botaoPrimario, textDecoration: "none" }}>
            + Cadastrar
          </Link>
        )
      }
    >
      {erro && <p style={{ color: cor.urgente }}>Erro ao carregar: {erro}</p>}

      <div style={{ ...card, padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" } as React.CSSProperties}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: `1px solid ${cor.borda}` }}>
              <th style={{ padding: "10px 12px" }}>Nome</th>
              <th style={{ padding: "10px 12px" }}>Matrícula</th>
              <th style={{ padding: "10px 12px" }}></th>
            </tr>
          </thead>
          <tbody>
            {itens.map((i) => (
              <tr key={i.id} style={{ borderBottom: `1px solid ${cor.borda}` }}>
                <td style={{ padding: "10px 12px", fontWeight: 600 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {i.nome}
                    <BotaoCopiar texto={i.nome} />
                  </div>
                </td>
                <td style={{ padding: "10px 12px" }}>
                  {i.matricula && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {i.matricula}
                      <BotaoCopiar texto={i.matricula} />
                    </div>
                  )}
                </td>
                <td style={{ padding: "10px 12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    {i.matricula && (
                      <BotaoCopiar texto={`${i.nome}, matrícula SIAPE nº ${i.matricula}`} rotulo="Copiar nome + matrícula" />
                    )}
                    {isAdmin && (
                      <>
                        <button
                          type="button"
                          onClick={() => abrirEdicao(i)}
                          title="Editar"
                          aria-label={`Editar ${i.nome}`}
                          style={{
                            fontSize: 10.5,
                            padding: "3px 9px",
                            borderRadius: 8,
                            border: "none",
                            background: "rgba(96,93,93,.10)",
                            color: cor.textoSecundario,
                          }}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          disabled={excluindoId === i.id}
                          onClick={() => excluir(i)}
                          title="Excluir"
                          aria-label={`Excluir ${i.nome}`}
                          style={{
                            fontSize: 10.5,
                            padding: "3px 9px",
                            borderRadius: 8,
                            border: "none",
                            background: cor.urgenteFundo,
                            color: cor.urgente,
                          }}
                        >
                          {excluindoId === i.id ? "..." : "Excluir"}
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {itens.length === 0 && (
              <tr>
                <td colSpan={3} style={{ padding: "10px 12px", color: cor.textoTerciario }}>
                  Nenhum cadastro ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      {editando && (
        <div
          onClick={() => setEditando(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 60,
            background: "rgba(32,31,29,.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: 18,
              width: "100%",
              maxWidth: 380,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <strong style={{ fontSize: 13 }}>Editar cadastro</strong>
              <button
                type="button"
                onClick={() => setEditando(null)}
                aria-label="Fechar"
                style={{ width: 26, height: 26, borderRadius: "50%", border: "none", background: "rgba(32,31,29,.08)" }}
              >
                ×
              </button>
            </div>

            <form onSubmit={salvarEdicao} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <label>
                Nome completo
                <input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                  style={{ display: "block", width: "100%", padding: 8 }}
                />
              </label>
              <label>
                Matrícula
                <input
                  value={matricula}
                  onChange={(e) => setMatricula(e.target.value)}
                  required
                  style={{ display: "block", width: "100%", padding: 8 }}
                />
              </label>
              {erroForm && <p style={{ color: cor.urgente, margin: 0 }}>{erroForm}</p>}
              <button type="submit" disabled={salvando} style={botaoPrimario}>
                {salvando ? "Salvando..." : "Salvar"}
              </button>
            </form>
          </div>
        </div>
      )}
    </Painel>
  );
}
