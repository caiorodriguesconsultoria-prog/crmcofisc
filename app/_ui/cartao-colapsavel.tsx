"use client";

import { useState } from "react";
import { card, cor } from "@/lib/theme";

export default function CartaoColapsavel({
  titulo,
  abertoInicial = true,
  children,
}: {
  titulo: string;
  abertoInicial?: boolean;
  children: React.ReactNode;
}) {
  const [aberto, setAberto] = useState(abertoInicial);

  return (
    <div style={card}>
      <div
        onClick={() => setAberto((a) => !a)}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
      >
        <strong style={{ fontSize: 12.5 }}>{titulo}</strong>
        <span style={{ color: cor.textoTerciario, fontSize: 11 }}>{aberto ? "▾" : "▸"}</span>
      </div>
      {aberto && <div style={{ marginTop: 10 }}>{children}</div>}
    </div>
  );
}
