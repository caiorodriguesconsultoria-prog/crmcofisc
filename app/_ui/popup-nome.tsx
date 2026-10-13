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
            padding: 24,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "relative",
              background: "#fff",
              borderRadius: 16,
              padding: 18,
              width: "100%",
              maxWidth: "min(380px, calc(100vw - 48px))",
              maxHeight: "calc(100vh - 48px)",
              overflowY: "auto",
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {/* "x" sempre no canto, fora do fluxo do texto — antes disputava
                espaço na mesma linha do nome e ficava espremido contra ele
                quando o nome era grande. */}
            <button
              type="button"
              onClick={() => setAberto(false)}
              aria-label="Fechar"
              style={{
                position: "absolute",
                top: 14,
                right: 14,
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

            <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingRight: 34 }}>
              <strong style={{ fontSize: 13, overflowWrap: "break-word" }}>{nome}</strong>
              <BotaoCopiar texto={nome} rotulo="Copiar nome" />
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
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontWeight: 600,
                        textAlign: "right",
                        minWidth: 0,
                        overflowWrap: "break-word",
                      }}
                    >
                      <span style={{ overflowWrap: "break-word" }}>{c.valores[0]}</span>
                      <BotaoCopiar texto={c.valores[0]} />
                    </span>
                  </div>
                ) : (
                  // Mais de um valor (ex.: vários e-mails) — todos listados,
                  // mas um único botão copia todos juntos de uma vez (mesmo
                  // padrão do "Copiar objeto + unidade" em Dados principais).
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
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ color: cor.textoTerciario }}>{c.label}</span>
                      <BotaoCopiar texto={c.valores.join("; ")} rotulo={`Copiar ${c.label.toLowerCase()}s`} />
                    </span>
                    {c.valores.map((v) => (
                      <span key={v} style={{ fontWeight: 600, textAlign: "center", overflowWrap: "break-word" }}>
                        {v}
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
