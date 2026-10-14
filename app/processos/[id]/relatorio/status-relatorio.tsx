"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cor, botaoPrimario } from "@/lib/theme";

const LIMITE_DIAS = 10;

function desatualizado(relatorioAtualizadoEm: string | null) {
  if (!relatorioAtualizadoEm) return true;
  const dias = (Date.now() - new Date(relatorioAtualizadoEm).getTime()) / (1000 * 60 * 60 * 24);
  return dias > LIMITE_DIAS;
}

export default function StatusRelatorio({
  processoId,
  relatorioAtualizadoEm,
}: {
  processoId: string;
  relatorioAtualizadoEm: string | null;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [salvando, setSalvando] = useState(false);
  const estaDesatualizado = desatualizado(relatorioAtualizadoEm);

  async function marcarAtualizado() {
    setSalvando(true);
    await supabase
      .from("processos")
      .update({ relatorio_atualizado_em: new Date().toISOString() })
      .eq("id", processoId);
    setSalvando(false);
    router.refresh();
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          padding: "3px 10px",
          borderRadius: 12,
          color: estaDesatualizado ? cor.vermelhoEscuro : cor.verdeEscuro,
          background: estaDesatualizado ? cor.vermelhoEscuroFundo : cor.verdeEscuroFundo,
          whiteSpace: "nowrap",
        }}
      >
        {estaDesatualizado ? "Relatório Desatualizado" : "Relatório Atualizado"}
      </span>
      {relatorioAtualizadoEm && (
        <span style={{ fontSize: 11.5, color: cor.textoTerciario }}>
          Última atualização: {new Date(relatorioAtualizadoEm).toLocaleDateString("pt-BR")}
        </span>
      )}
      <button
        type="button"
        onClick={marcarAtualizado}
        disabled={salvando}
        style={{ ...botaoPrimario, fontSize: 11.5, padding: "6px 14px" }}
      >
        Marcar relatório como atualizado
      </button>
    </div>
  );
}
