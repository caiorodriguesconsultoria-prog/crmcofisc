"use client";

import { useState } from "react";
import { cor } from "@/lib/theme";

export default function Abas({
  processo,
  relatorio,
}: {
  processo: React.ReactNode;
  relatorio: React.ReactNode;
}) {
  const [aba, setAba] = useState<"processo" | "relatorio">("processo");
  const [relatorioAberto, setRelatorioAberto] = useState(false);

  function irPara(a: "processo" | "relatorio") {
    setAba(a);
    if (a === "relatorio") setRelatorioAberto(true);
  }

  return (
    <>
      <div
        style={{
          display: "inline-flex",
          gap: 2,
          background: "rgba(96,93,93,.10)",
          borderRadius: 12,
          padding: 3,
          marginBottom: 16,
        }}
      >
        {(["processo", "relatorio"] as const).map((a) => (
          <button
            key={a}
            onClick={() => irPara(a)}
            style={{
              border: "none",
              fontSize: 12.5,
              padding: "7px 16px",
              borderRadius: 9,
              background: aba === a ? "#fff" : "transparent",
              color: aba === a ? cor.texto : cor.textoSecundario,
              boxShadow: aba === a ? "0 1px 2px rgba(0,0,0,.08)" : "none",
            }}
          >
            {a === "processo" ? "Processo" : "Relatório"}
          </button>
        ))}
      </div>

      <div style={{ display: aba === "processo" ? "block" : "none" }}>{processo}</div>
      {relatorioAberto && (
        <div style={{ display: aba === "relatorio" ? "block" : "none" }}>{relatorio}</div>
      )}
    </>
  );
}
