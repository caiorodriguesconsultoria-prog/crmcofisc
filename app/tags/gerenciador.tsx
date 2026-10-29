"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cor, raio } from "@/lib/theme";
import CardBento from "@/app/_ui/card-bento";

type Tag = { id: string; categoria: "evento" | "forma_entrega"; valor: string; cor: string | null; ativo: boolean };

const ROTULO_CATEGORIA = { evento: "Eventos", forma_entrega: "Forma de entrega" } as const;

export default function Gerenciador({ tags }: { tags: Tag[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [salvandoId, setSalvandoId] = useState<string | null>(null);
  const [novoValor, setNovoValor] = useState<Record<string, string>>({});
  const [novaCor, setNovaCor] = useState<Record<string, string>>({});
  const [criando, setCriando] = useState<string | null>(null);

  // Tenta apagar de verdade; se a tag já foi usada em algum contrato, o
  // banco recusa (chave estrangeira) — nesse caso só desativa, pra não
  // quebrar o histórico de quem já usou. Mesmo comportamento que o "apagar
  // evento" que já existia nos atalhos de /processos.
  async function excluir(tag: Tag) {
    if (!confirm(`Excluir "${tag.valor}"? Se já tiver sido usada em algum contrato, só vai ficar desativada.`)) return;
    setSalvandoId(tag.id);
    const { error } = await supabase.from("tags").delete().eq("id", tag.id);
    if (error) {
      await supabase.from("tags").update({ ativo: false }).eq("id", tag.id);
    }
    setSalvandoId(null);
    router.refresh();
  }

  async function reativar(tag: Tag) {
    setSalvandoId(tag.id);
    await supabase.from("tags").update({ ativo: true }).eq("id", tag.id);
    setSalvandoId(null);
    router.refresh();
  }

  async function mudarCor(tag: Tag, novaCorValor: string) {
    setSalvandoId(tag.id);
    await supabase.from("tags").update({ cor: novaCorValor }).eq("id", tag.id);
    setSalvandoId(null);
    router.refresh();
  }

  async function criar(categoria: "evento" | "forma_entrega") {
    const valor = (novoValor[categoria] ?? "").trim();
    if (!valor) return;
    setCriando(categoria);
    await supabase.from("tags").insert({
      categoria,
      valor,
      ativo: true,
      cor: categoria === "evento" ? (novaCor[categoria] ?? "#2F5FDB") : null,
    });
    setCriando(null);
    setNovoValor((atual) => ({ ...atual, [categoria]: "" }));
    router.refresh();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 20 }}>
      {(["evento", "forma_entrega"] as const).map((categoria, indice) => {
        const dessaCategoria = tags.filter((t) => t.categoria === categoria);
        return (
          <CardBento key={categoria} titulo={ROTULO_CATEGORIA[categoria]} indice={indice}>
            {dessaCategoria.length === 0 ? (
              <p style={{ color: cor.textoTerciario, fontSize: 13, margin: 0 }}>Nenhuma ainda.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {dessaCategoria.map((tag) => (
                  <div
                    key={tag.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "9px 0",
                      borderBottom: `1px solid ${cor.borda}`,
                      opacity: tag.ativo ? 1 : 0.5,
                    }}
                  >
                    {categoria === "evento" && (
                      <input
                        type="color"
                        value={tag.cor ?? "#2F5FDB"}
                        onChange={(e) => mudarCor(tag, e.target.value)}
                        disabled={salvandoId === tag.id}
                        title="Cor da tag"
                        style={{ width: 20, height: 20, padding: 0, border: "none", background: "none", flex: "none" }}
                      />
                    )}
                    <span style={{ fontSize: 13.5, fontWeight: 600, flex: 1, minWidth: 0 }}>{tag.valor}</span>
                    {!tag.ativo && (
                      <span style={{ fontSize: 10.5, color: cor.textoTerciario, flex: "none" }}>desativada</span>
                    )}
                    {tag.ativo ? (
                      <button
                        type="button"
                        onClick={() => excluir(tag)}
                        disabled={salvandoId === tag.id}
                        aria-label={`Excluir ${tag.valor}`}
                        title="Excluir"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                          fontSize: 11.5,
                          fontWeight: 600,
                          padding: "5px 10px",
                          borderRadius: raio.pilula,
                          border: "none",
                          background: cor.urgenteFundo,
                          color: cor.urgente,
                          flex: "none",
                        }}
                      >
                        <Trash2 size={12} />
                        Excluir
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => reativar(tag)}
                        disabled={salvandoId === tag.id}
                        style={{
                          fontSize: 11.5,
                          fontWeight: 600,
                          padding: "5px 10px",
                          borderRadius: raio.pilula,
                          border: "none",
                          background: "rgba(96,93,93,.10)",
                          color: cor.textoSecundario,
                          flex: "none",
                        }}
                      >
                        Reativar
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: "flex", gap: 8, marginTop: 14, alignItems: "center" }}>
              <input
                value={novoValor[categoria] ?? ""}
                onChange={(e) => setNovoValor((atual) => ({ ...atual, [categoria]: e.target.value }))}
                placeholder={categoria === "evento" ? "Nome do evento" : "Nome da forma de entrega"}
                style={{ padding: 8, flex: "1 1 200px", maxWidth: 260 }}
              />
              {categoria === "evento" && (
                <input
                  type="color"
                  value={novaCor[categoria] ?? "#2F5FDB"}
                  onChange={(e) => setNovaCor((atual) => ({ ...atual, [categoria]: e.target.value }))}
                  title="Cor da nova tag"
                  style={{ width: 32, height: 32, padding: 0, border: "none", background: "none" }}
                />
              )}
              <button
                type="button"
                onClick={() => criar(categoria)}
                disabled={criando === categoria || !(novoValor[categoria] ?? "").trim()}
              >
                + Nova
              </button>
            </div>
          </CardBento>
        );
      })}

      <CardBento indice={2}>
        <p style={{ margin: 0, fontSize: 13, color: cor.textoSecundario }}>
          Coordenações têm uma tela própria —{" "}
          <a href="/coordenacoes" style={{ color: cor.destaque, fontWeight: 600 }}>
            gerenciar coordenações →
          </a>
        </p>
      </CardBento>
    </div>
  );
}
