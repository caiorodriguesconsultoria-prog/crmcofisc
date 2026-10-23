"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cor } from "@/lib/theme";

type Aviso = {
  id: string;
  contexto: string;
  mensagem: string;
  created_at: string;
  lido_em: string | null;
};

function formatarData(data: string) {
  return new Date(data).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

// Pequena variação de rotação por índice (não aleatória de verdade — evita
// divergência entre o HTML gerado no servidor e o re-render no cliente),
// só pra dar aquele ar de "post-it colado na parede" do mural do GEFISC.
const ROTACOES = [-2, 1.5, -1, 2, -1.5, 1];

export default function ListaAvisos({
  avisos,
  minhaPessoaId,
}: {
  avisos: Aviso[];
  minhaPessoaId: string | null;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [marcandoId, setMarcandoId] = useState<string | null>(null);

  const naoLidos = avisos.filter((a) => !a.lido_em).length;

  async function marcarComoLido(id: string) {
    setMarcandoId(id);
    await supabase
      .from("alertas_sistema")
      .update({ lido_em: new Date().toISOString(), lido_por: minhaPessoaId })
      .eq("id", id);
    setMarcandoId(null);
    router.refresh();
  }

  if (avisos.length === 0) {
    return <p style={{ color: cor.textoTerciario, fontSize: 13, marginTop: 20 }}>Nenhum aviso registrado ainda.</p>;
  }

  return (
    <div style={{ marginTop: 16 }}>
      {naoLidos > 0 && (
        <p style={{ fontSize: 12.5, color: cor.urgente, fontWeight: 600, margin: "0 0 14px" }}>
          {naoLidos} aviso{naoLidos > 1 ? "s" : ""} não lido{naoLidos > 1 ? "s" : ""}
        </p>
      )}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 20,
          padding: "4px 2px",
        }}
      >
        {avisos.map((a, i) => {
          const lido = !!a.lido_em;
          const rotacao = ROTACOES[i % ROTACOES.length];
          return (
            <div
              key={a.id}
              style={{
                background: lido ? "#F5F3EC" : cor.amareloFundo,
                borderRadius: 3,
                padding: "16px 14px 14px",
                boxShadow: lido ? "0 1px 3px rgba(0,0,0,.08)" : "0 3px 8px rgba(0,0,0,.14)",
                transform: `rotate(${rotacao}deg)`,
                transition: "transform .15s ease",
                position: "relative",
                opacity: lido ? 0.75 : 1,
              }}
            >
              <span
                aria-hidden
                style={{
                  position: "absolute",
                  top: -7,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: 13,
                  height: 13,
                  borderRadius: "50%",
                  background: lido ? "#B5AF9A" : cor.urgente,
                  boxShadow: "0 2px 3px rgba(0,0,0,.25)",
                }}
              />
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  color: lido ? cor.textoTerciario : cor.vermelhoEscuro,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                {a.contexto}
              </span>
              <p style={{ margin: "6px 0 0", fontSize: 13, overflowWrap: "break-word", color: cor.texto }}>
                {a.mensagem}
              </p>
              <span style={{ display: "block", marginTop: 8, fontSize: 10.5, color: cor.textoTerciario }}>
                {formatarData(a.created_at)}
              </span>
              {!lido && (
                <button
                  type="button"
                  onClick={() => marcarComoLido(a.id)}
                  disabled={marcandoId === a.id}
                  style={{ fontSize: 10.5, padding: "4px 9px", marginTop: 8 }}
                >
                  {marcandoId === a.id ? "..." : "Marcar como lido"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
