"use client";

import { useState } from "react";
import ControleSegmentado from "@/app/_ui/controle-segmentado";

const ROTULOS = { resumo: "Resumo", andamentos: "Andamentos", relatorio: "Relatório" } as const;
type AbaId = keyof typeof ROTULOS;

// Cartão único do processo com as abas Resumo/Andamentos/Relatório (Etapa 4
// do redesenho) — o Relatório continua sendo uma aba daqui, nunca um menu
// global (regra que já valia antes e segue valendo). "Resumo" e "Andamentos"
// são a mesma tela de antes ("Contrato"), só dividida em duas pra não ficar
// uma rolagem só gigante. Controle trocado pelo `ControleSegmentado` (CRM
// Premium, Etapa 5 — seção 7 do CRM_PREMIUM_SPEC.md pede explicitamente
// "controle segmentado animado" aqui), com o indicador deslizante em vez do
// fundo branco estático de antes.
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
        <ControleSegmentado
          opcoes={(Object.keys(ROTULOS) as AbaId[]).map((a) => ({ valor: a, rotulo: ROTULOS[a] }))}
          valor={aba}
          aoMudar={irPara}
          tamanho="compacto"
        />

        {eventosAtivos && <div style={{ flex: "1 1 260px", maxWidth: 420 }}>{eventosAtivos}</div>}
      </div>

      {statusTags && <div style={{ marginTop: -8, marginBottom: 16 }}>{statusTags}</div>}

      <div style={{ display: aba === "resumo" ? "block" : "none" }}>{resumo}</div>
      {jaAbriu.andamentos && <div style={{ display: aba === "andamentos" ? "block" : "none" }}>{andamentos}</div>}
      {jaAbriu.relatorio && <div style={{ display: aba === "relatorio" ? "block" : "none" }}>{relatorio}</div>}
    </>
  );
}
