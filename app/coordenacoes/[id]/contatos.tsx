"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { botaoPrimario, card, cor } from "@/lib/theme";

type Contato = { id: string; nome: string; email: string | null; ramal: string | null };

async function copiar(texto: string) {
  try {
    await navigator.clipboard.writeText(texto);
  } catch {
    // sem permissão de clipboard — ignora silenciosamente
  }
}

function Copiar({ texto }: { texto: string }) {
  if (!texto) return null;
  return (
    <button
      type="button"
      onClick={() => copiar(texto)}
      style={{ fontSize: 10.5, padding: "2px 8px", marginLeft: 6 }}
    >
      copiar
    </button>
  );
}

export default function Contatos({
  coordenacaoId,
  coordenacaoLabel,
  isAdmin,
  contatos,
}: {
  coordenacaoId: string;
  coordenacaoLabel: string;
  isAdmin: boolean;
  contatos: Contato[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState<string | null>(null);
  const [novo, setNovo] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [ramal, setRamal] = useState("");

  async function adicionar() {
    if (!nome.trim()) return;
    setErro(null);
    setCarregando("novo");
    const { error } = await supabase.from("coordenacao_contatos").insert({
      coordenacao_id: coordenacaoId,
      nome: nome.trim(),
      email: email.trim() || null,
      ramal: ramal.trim() || null,
    });
    setCarregando(null);
    if (error) {
      setErro(error.message);
      return;
    }
    setNovo(false);
    setNome("");
    setEmail("");
    setRamal("");
    router.refresh();
  }

  async function remover(id: string) {
    setErro(null);
    setCarregando(id);
    const { error } = await supabase.from("coordenacao_contatos").delete().eq("id", id);
    setCarregando(null);
    if (error) {
      setErro(error.message);
      return;
    }
    router.refresh();
  }

  return (
    <div style={{ marginTop: 24 }}>
      <h2 style={{ fontSize: 16 }}>Contatos</h2>
      <p style={{ fontSize: 12, color: cor.textoTerciario, margin: "2px 0 8px" }}>
        Pessoas da área técnica dessa coordenação, pra encaminhar avaliação de eventos/ocorrências.
      </p>

      {erro && <p style={{ color: cor.urgente }}>{erro}</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {contatos.map((c) => {
          const linhaCompleta = `${c.nome} — ${coordenacaoLabel}${c.email ? ` — ${c.email}` : ""}${c.ramal ? ` — ramal ${c.ramal}` : ""}`;
          return (
            <div key={c.id} style={{ ...card, padding: "10px 14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <strong style={{ fontSize: 13 }}>{c.nome}</strong>
                <Copiar texto={c.nome} />
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => remover(c.id)}
                    disabled={carregando === c.id}
                    style={{ marginLeft: "auto", fontSize: 11 }}
                  >
                    remover
                  </button>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", marginTop: 4, fontSize: 12.5 }}>
                <span style={{ color: cor.textoSecundario }}>E-mail: {c.email ?? "—"}</span>
                {c.email && <Copiar texto={c.email} />}
              </div>
              <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", marginTop: 4, fontSize: 12.5 }}>
                <span style={{ color: cor.textoSecundario }}>Ramal: {c.ramal ?? "—"}</span>
                {c.ramal && <Copiar texto={c.ramal} />}
              </div>
              <div style={{ marginTop: 6 }}>
                <button type="button" onClick={() => copiar(linhaCompleta)} style={{ fontSize: 11 }}>
                  copiar tudo
                </button>
              </div>
            </div>
          );
        })}
        {contatos.length === 0 && (
          <p style={{ color: cor.textoTerciario, fontSize: 13 }}>Nenhum contato cadastrado.</p>
        )}
      </div>

      {isAdmin &&
        (novo ? (
          <div style={{ ...card, marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
            <input placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} />
            <input placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input placeholder="Ramal" value={ramal} onChange={(e) => setRamal(e.target.value)} />
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={adicionar} disabled={carregando === "novo" || !nome.trim()} style={botaoPrimario}>
                Salvar
              </button>
              <button onClick={() => setNovo(false)} disabled={carregando === "novo"}>
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setNovo(true)} style={{ marginTop: 10 }}>
            + Adicionar contato
          </button>
        ))}
    </div>
  );
}
