"use client";

import { useState } from "react";
import { cor } from "@/lib/theme";

const ROTULOS = { resumo: "Resumo", andamentos: "Andamentos", relatorio: "Relatório" } as const;
type AbaId = keyof typeof ROTULOS;

// Cartão único do processo com as abas Resumo/Andamentos/Relatório (Etapa 4
// do redesenho) — o Relatório continua sendo uma aba daqui, nunca um menu
// global (regra que já valia antes e segue valendo). "Resumo" e "Andamentos"
// são a mesma tela de antes ("Contrato"), só dividida em duas pra não ficar
// uma rolagem só gigante.
export default function Abas({
  resumo,
  andamentos,
  relatorio,
  eventosAtivos,
  statusTags,
}: {
  resumo: React.ReactNode;
  andamentos: React.ReactNode;
  relatorio: React.ReactNode;
  eventosAtivos?: React.ReactNode;
  statusTags?: React.ReactNode;
}) {
  const [aba, setAba] = useState<AbaId>("resumo");
  const [jaAbriu, setJaAbriu] = useState<Record<AbaId, boolean>>({ resumo: true, andamentos: false, relatorio: false });

  function irPara(a: AbaId) {
    setAba(a);
    setJaAbriu((atual) => (atual[a] ? atual : { ...atual, [a]: true }));
  }

  return (
    <>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
        <div
          style={{
            display: "inline-flex",
            gap: 2,
            background: "rgba(96,93,93,.10)",
            borderRadius: 12,
            padding: 3,
            flex: "none",
          }}
        >
          {(Object.keys(ROTULOS) as AbaId[]).map((a) => (
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
              {ROTULOS[a]}
            </button>
          ))}
        </div>

        {eventosAtivos && <div style={{ flex: "1 1 260px", maxWidth: 420 }}>{eventosAtivos}</div>}
      </div>

      {statusTags && <div style={{ marginTop: -8, marginBottom: 16 }}>{statusTags}</div>}

      <div style={{ display: aba === "resumo" ? "block" : "none" }}>{resumo}</div>
      {jaAbriu.andamentos && <div style={{ display: aba === "andamentos" ? "block" : "none" }}>{andamentos}</div>}
      {jaAbriu.relatorio && <div style={{ display: aba === "relatorio" ? "block" : "none" }}>{relatorio}</div>}
    </>
  );
}
