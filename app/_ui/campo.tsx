"use client";

import { cor } from "@/lib/theme";

async function copiar(texto: string) {
  try {
    await navigator.clipboard.writeText(texto);
  } catch {
    // sem permissão de clipboard — ignora silenciosamente
  }
}

export function BotaoCopiar({ texto }: { texto: string }) {
  if (!texto) return null;
  return (
    <button type="button" onClick={() => copiar(texto)} style={{ fontSize: 10.5, padding: "3px 8px", flex: "none" }}>
      copiar
    </button>
  );
}

export function LinhaChave({ label, valor }: { label: string; valor: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        padding: "7px 0",
        borderBottom: `1px solid ${cor.borda}`,
        fontSize: 12.5,
      }}
    >
      <span style={{ color: cor.textoTerciario, flex: "none" }}>{label}</span>
      <span style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 600, textAlign: "right" }}>
        {valor}
        <BotaoCopiar texto={valor} />
      </span>
    </div>
  );
}

export function CampoLinha({
  label,
  valor,
  acao,
}: {
  label: string;
  valor: string;
  acao?: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <span
        style={{
          fontSize: 10.5,
          fontWeight: 500,
          textTransform: "uppercase",
          letterSpacing: 1,
          color: cor.textoTerciario,
        }}
      >
        {label}
      </span>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: 13,
          fontWeight: 500,
          paddingBottom: 8,
          borderBottom: `1px solid ${cor.borda}`,
        }}
      >
        <span style={{ flex: 1 }}>{valor}</span>
        <BotaoCopiar texto={valor} />
        {acao}
      </div>
    </div>
  );
}
