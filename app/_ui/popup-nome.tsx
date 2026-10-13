"use client";

import { useState } from "react";
import { cor } from "@/lib/theme";
import { BotaoCopiar } from "./campo";

type Campo = { label: string; valor: string | string[] };

// Clicar no nome (coordenação, fornecedor, gestor/fiscal) abre uma janela
// com os dados de contato pra copiar, em vez de precisar navegar até a
// tela de cadastro correspondente. "x" ou clicar fora fecha.
export default function PopupNome({
  nome,
  campos,
}: {
  nome: string;
  campos: Campo[];
}) {
  const [aberto, setAberto] = useState(false);
  const camposPreenchidos = campos
    .map((c) => ({ label: c.label, valores: (Array.isArray(c.valor) ? c.valor : [c.valor]).filter(Boolean) }))
    .filter((c) => c.valores.length > 0);

  if (!nome || camposPreenchidos.length === 0) {
    return <>{nome || "não informado"}</>;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        style={{
          border: "none",
          background: "none",
          padding: 0,
          font: "inherit",
          fontWeight: "inherit",
          color: "inherit",
          cursor: "pointer",
          textDecoration: "underline",
          textDecorationStyle: "dotted",
          textDecorationColor: cor.textoTerciario,
          textUnderlineOffset: 2,
        }}
      >
        {nome}
      </button>

      {aberto && (
        <div
          onClick={() => setAberto(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 70,
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
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                <strong style={{ fontSize: 13 }}>{nome}</strong>
                <BotaoCopiar texto={nome} />
              </span>
              <button
                type="button"
                onClick={() => setAberto(false)}
                aria-label="Fechar"
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  border: "none",
                  background: "rgba(32,31,29,.08)",
                  flex: "none",
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {camposPreenchidos.map((c) =>
                c.valores.length === 1 ? (
                  <div
                    key={c.label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                      padding: "6px 0",
                      borderBottom: `1px solid ${cor.borda}`,
                      fontSize: 12.5,
                    }}
                  >
                    <span style={{ color: cor.textoTerciario, flex: "none" }}>{c.label}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 600, textAlign: "right" }}>
                      {c.valores[0]}
                      <BotaoCopiar texto={c.valores[0]} />
                    </span>
                  </div>
                ) : (
                  // Mais de um valor (ex.: vários e-mails) — um embaixo do
                  // outro, cada um com seu próprio botão de copiar, em vez de
                  // juntar tudo numa linha só.
                  <div
                    key={c.label}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                      padding: "6px 0",
                      borderBottom: `1px solid ${cor.borda}`,
                      fontSize: 12.5,
                    }}
                  >
                    <span style={{ color: cor.textoTerciario }}>{c.label}</span>
                    {c.valores.map((v) => (
                      <span
                        key={v}
                        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontWeight: 600 }}
                      >
                        {v}
                        <BotaoCopiar texto={v} />
                      </span>
                    ))}
                  </div>
                ),
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
