"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { botaoPrimario, card, cor } from "@/lib/theme";
import { BotaoCopiar } from "@/app/_ui/campo";
import Painel from "@/app/_ui/painel";
import ControleSegmentado from "@/app/_ui/controle-segmentado";
import { estaAusente, periodoAusencia } from "@/lib/ausencia";

type Papel = "gestor" | "fiscal";

type Item = {
  id: string;
  papel: Papel;
  nome: string;
  matricula: string | null;
  ausenciaInicio: string | null;
  ausenciaFim: string | null;
};

const ROTULO_PAPEL: Record<Papel, string> = { gestor: "Gestor", fiscal: "Fiscal" };

// CRM Premium, Etapa 2 (navegação — unificação de Gestores e Fiscais, seção
// 4 do CRM_PREMIUM_SPEC.md): uma pessoa pode ter os dois vínculos (um por
// contrato), então ela aparece uma vez por vínculo (como já acontecia nas
// duas páginas separadas) — unificar só juntou a exibição, não mudou o
// modelo de dados nem apagou vínculo nenhum (pessoa_papeis continua intocado).
export default function ListaPessoasPapel({
  isAdmin,
  itens,
  erro,
}: {
  isAdmin: boolean;
  itens: Item[];
  erro?: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const searchParams = useSearchParams();
  const [filtro, setFiltro] = useState<"todos" | Papel>(() => {
    const p = searchParams.get("papel");
    return p === "gestor" || p === "fiscal" ? p : "todos";
  });

  const itensFiltrados = useMemo(() => (filtro === "todos" ? itens : itens.filter((i) => i.papel === filtro)), [itens, filtro]);
  const novoHref = filtro === "fiscal" ? "/fiscais/novo" : "/gestores/novo";
  const tituloBotaoNovo = filtro === "fiscal" ? "+ Cadastrar fiscal" : "+ Cadastrar gestor";

  const [editando, setEditando] = useState<Item | null>(null);
  const [nome, setNome] = useState("");
  const [matricula, setMatricula] = useState("");
  const [ausenciaInicio, setAusenciaInicio] = useState("");
  const [ausenciaFim, setAusenciaFim] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erroForm, setErroForm] = useState<string | null>(null);
  const [excluindoId, setExcluindoId] = useState<string | null>(null);

  function abrirEdicao(item: Item) {
    setEditando(item);
    setNome(item.nome);
    setMatricula(item.matricula ?? "");
    setAusenciaInicio(item.ausenciaInicio ?? "");
    setAusenciaFim(item.ausenciaFim ?? "");
    setErroForm(null);
  }

  async function salvarEdicao(e: React.FormEvent) {
    e.preventDefault();
    if (!editando) return;
    setErroForm(null);
    setSalvando(true);
    const { error } = await supabase
      .from("pessoas")
      .update({
        nome,
        matricula,
        ausencia_inicio: ausenciaInicio || null,
        ausencia_fim: ausenciaFim || null,
      })
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
    if (!window.confirm(`Remover ${item.nome} da lista de ${ROTULO_PAPEL[item.papel].toLowerCase()}s?`)) return;
    setExcluindoId(item.id);
    const { error } = await supabase
      .from("pessoa_papeis")
      .delete()
      .eq("pessoa_id", item.id)
      .eq("papel", item.papel);
    setExcluindoId(null);
    if (error) {
      window.alert(error.message);
      return;
    }
    router.refresh();
  }

  return (
    <Painel
      titulo="Gestores e Fiscais"
      voltarHref="/dashboard"
      maxWidth={900}
      fundoAurora
      acao={
        isAdmin && (
          <Link href={novoHref} style={{ ...botaoPrimario, textDecoration: "none" }}>
            {tituloBotaoNovo}
          </Link>
        )
      }
    >
      {erro && <p style={{ color: cor.urgente }}>Erro ao carregar: {erro}</p>}

      <div style={{ marginBottom: 14 }}>
        <ControleSegmentado
          opcoes={[
            { valor: "todos" as const, rotulo: "Todos" },
            { valor: "gestor" as const, rotulo: "Gestores" },
            { valor: "fiscal" as const, rotulo: "Fiscais" },
          ]}
          valor={filtro}
          aoMudar={setFiltro}
        />
      </div>

      <div style={{ ...card, padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" } as React.CSSProperties}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: `1px solid ${cor.borda}` }}>
              <th style={{ padding: "10px 12px" }}>Nome</th>
              {filtro === "todos" && <th style={{ padding: "10px 12px" }}>Vínculo</th>}
              <th style={{ padding: "10px 12px" }}>Matrícula</th>
              <th style={{ padding: "10px 12px" }}></th>
            </tr>
          </thead>
          <tbody>
            {itensFiltrados.map((i) => (
              <tr key={`${i.id}-${i.papel}`} style={{ borderBottom: `1px solid ${cor.borda}` }}>
                <td style={{ padding: "10px 12px", fontWeight: 600 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    {i.nome}
                    <BotaoCopiar texto={i.nome} />
                    {estaAusente(i.ausenciaInicio, i.ausenciaFim) && i.ausenciaInicio && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: "2px 7px",
                          borderRadius: 10,
                          color: cor.urgente,
                          background: cor.urgenteFundo,
                          whiteSpace: "nowrap",
                        }}
                      >
                        Ausente · {periodoAusencia(i.ausenciaInicio, i.ausenciaFim)}
                      </span>
                    )}
                  </div>
                </td>
                {filtro === "todos" && (
                  <td style={{ padding: "10px 12px" }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: "2px 9px",
                        borderRadius: 20,
                        color: i.papel === "gestor" ? cor.destaque : cor.verdeEscuro,
                        background: i.papel === "gestor" ? cor.destaqueFundo : cor.verdeEscuroFundo,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {ROTULO_PAPEL[i.papel]}
                    </span>
                  </td>
                )}
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
                <td colSpan={filtro === "todos" ? 4 : 3} style={{ padding: "10px 12px", color: cor.textoTerciario }}>
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
              <div style={{ display: "flex", gap: 8 }}>
                <label style={{ flex: 1 }}>
                  Início da ausência
                  <input
                    type="date"
                    value={ausenciaInicio}
                    onChange={(e) => setAusenciaInicio(e.target.value)}
                    style={{ display: "block", width: "100%", padding: 8 }}
                  />
                </label>
                <label style={{ flex: 1 }}>
                  Fim da ausência
                  <input
                    type="date"
                    value={ausenciaFim}
                    onChange={(e) => setAusenciaFim(e.target.value)}
                    style={{ display: "block", width: "100%", padding: 8 }}
                  />
                </label>
              </div>
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
