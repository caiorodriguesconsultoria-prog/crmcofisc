"use client";

import { useState } from "react";
import Link from "next/link";
import { cor } from "@/lib/theme";
import type { Atividade } from "./sidebar";

function Grupo({ titulo, itens }: { titulo: string; itens: Atividade[] }) {
  const [aberto, setAberto] = useState(false);
  const total = itens.reduce((soma, a) => soma + a.count, 0);

  return (
    <div>
      <button
        type="button"
        onClick={() => setAberto((a) => !a)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: 10.5,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: 1,
          color: cor.textoTerciario,
          padding: "10px 12px",
          margin: "6px 0 0",
          border: "none",
          background: "transparent",
        }}
      >
        <span style={{ fontSize: 9, transform: aberto ? "rotate(90deg)" : "none", transition: "transform .15s" }}>▸</span>
        {titulo}
        <span style={{ marginLeft: "auto", fontWeight: 600 }}>{total}</span>
      </button>
      {aberto && (
        <div>
          {itens.map((a) => (
            <Link
              key={a.label}
              href={a.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 12.5,
                fontWeight: 500,
                padding: "7px 12px",
                borderRadius: 10,
                color: cor.texto,
                textDecoration: "none",
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: a.dot, flex: "none" }} />
              <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {a.label}
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 600, color: cor.textoTerciario }}>{a.count}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function GruposAtividades({
  atividades,
  eventos,
}: {
  atividades: Atividade[];
  eventos: Atividade[];
}) {
  return (
    <>
      {atividades.length > 0 && <Grupo titulo="Atividades" itens={atividades} />}
      {eventos.length > 0 && <Grupo titulo="Eventos" itens={eventos} />}
    </>
  );
}
