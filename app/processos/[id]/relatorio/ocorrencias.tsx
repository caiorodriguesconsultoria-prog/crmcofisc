"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { botaoPrimario, cor, pill } from "@/lib/theme";
import { corEvento } from "@/lib/cores-evento";

type Tag = { id: string; valor: string };

type Andamento = {
  id: string;
  tipo: string;
  texto: string;
  data: string;
  incluirRelatorio: boolean;
  tags: Tag[];
};

export default function Ocorrencias({
  processoId,
  autorId,
  andamentos,
}: {
  processoId: string;
  autorId: string | null;
  andamentos: Andamento[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [modalAberto, setModalAberto] = useState(false);
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const marcados = andamentos.filter((a) => a.incluirRelatorio);
  const ordenados = [...andamentos].sort((a, b) => a.data.localeCompare(b.data));

  function alternarSelecao(id: string) {
    setSelecionados((atual) => (atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id]));
  }

  function fecharModal() {
    setModalAberto(false);
    setSelecionados([]);
    setErro(null);
  }

  async function criarOcorrencia() {
    const escolhidos = ordenados.filter((a) => selecionados.includes(a.id));
    if (escolhidos.length === 0) return;
    setErro(null);
    setSalvando(true);

    const texto = escolhidos.map((a) => a.texto).join("\n\n");
    const tagIds = Array.from(new Set(escolhidos.flatMap((a) => a.tags.map((t) => t.id))));

    const { data: criado, error } = await supabase
      .from("andamentos")
      .insert({
        processo_id: processoId,
        tipo: "Ocorrência",
        texto,
        autor_id: autorId,
        incluir_relatorio: true,
      })
      .select("id")
      .single();

    if (error || !criado) {
      setSalvando(false);
      setErro(error?.message ?? "Erro ao criar ocorrência");
      return;
    }

    if (tagIds.length > 0) {
      const { error: erroTags } = await supabase
        .from("andamento_tags")
        .insert(tagIds.map((tagId) => ({ andamento_id: criado.id, tag_id: tagId })));
      if (erroTags) {
        setSalvando(false);
        setErro(erroTags.message);
        return;
      }
    }

    setSalvando(false);
    fecharModal();
    router.refresh();
  }

  return (
    <div style={{ marginTop: 8 }}>
      {marcados.length === 0 ? (
        <p style={{ color: cor.textoTerciario, marginTop: 4 }}>Nenhum andamento marcado como ocorrência.</p>
      ) : (
        <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
          {marcados.map((a) => (
            <p key={a.id} style={{ textAlign: "justify", margin: 0 }}>
              {a.texto}
            </p>
          ))}
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 8 }}>
        <p style={{ fontSize: 11, color: cor.textoTerciario, margin: 0 }}>
          Marcado como "Ocorrência" no painel do processo, seção "Andamento e Tarefas".
        </p>
        <button
          type="button"
          onClick={() => setModalAberto(true)}
          style={{ ...botaoPrimario, fontSize: 11, padding: "5px 12px", whiteSpace: "nowrap" }}
        >
          + Criar ocorrência
        </button>
      </div>

      {modalAberto && (
        <div
          onClick={fecharModal}
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
              maxWidth: 480,
              maxHeight: "85vh",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <strong style={{ fontSize: 13 }}>Criar ocorrência a partir de andamentos</strong>
              <button
                type="button"
                onClick={fecharModal}
                aria-label="Fechar"
                style={{ width: 26, height: 26, borderRadius: "50%", border: "none", background: "rgba(32,31,29,.08)" }}
              >
                ×
              </button>
            </div>
            <p style={{ fontSize: 12, color: cor.textoTerciario, margin: 0 }}>
              Selecione os andamentos que vão compor a ocorrência — o texto de cada um é combinado, em ordem
              cronológica, num andamento novo já marcado como ocorrência.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {ordenados.length === 0 && (
                <p style={{ fontSize: 12.5, color: cor.textoTerciario, margin: 0 }}>Nenhum andamento registrado.</p>
              )}
              {ordenados.map((a) => {
                const marcado = selecionados.includes(a.id);
                return (
                  <label
                    key={a.id}
                    style={{
                      display: "flex",
                      gap: 8,
                      alignItems: "flex-start",
                      padding: "8px 10px",
                      borderRadius: 10,
                      border: `1px solid ${marcado ? cor.destaque : cor.borda}`,
                      background: marcado ? cor.destaqueFundo : "transparent",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={marcado}
                      onChange={() => alternarSelecao(a.id)}
                      style={{ marginTop: 3 }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, color: cor.textoTerciario }}>
                        {new Date(a.data).toLocaleDateString("pt-BR")} · {a.tipo}
                      </div>
                      <div style={{ fontSize: 12.5, marginTop: 2 }}>{a.texto}</div>
                      {a.tags.length > 0 && (
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4 }}>
                          {a.tags.map((t) => {
                            const c = corEvento(t.id);
                            return (
                              <span key={t.id} style={{ ...pill, fontSize: 10, background: c.fundo, color: c.texto }}>
                                {t.valor}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>

            {erro && <p style={{ color: cor.urgente, margin: 0 }}>{erro}</p>}

            <button
              type="button"
              onClick={criarOcorrencia}
              disabled={salvando || selecionados.length === 0}
              style={botaoPrimario}
            >
              {salvando ? "Criando..." : `Criar ocorrência (${selecionados.length})`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
