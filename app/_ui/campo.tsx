"use client";

import { useRef } from "react";
import { cor } from "@/lib/theme";

async function copiar(texto: string) {
  try {
    await navigator.clipboard.writeText(texto);
  } catch {
    // sem permissão de clipboard — ignora silenciosamente
  }
}

function IconeCopiar() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

export function BotaoCopiar({ texto, rotulo }: { texto: string; rotulo?: string }) {
  if (!texto) return null;
  return (
    <button
      type="button"
      onClick={() => copiar(texto)}
      title={rotulo ?? "Copiar"}
      aria-label={rotulo ?? "Copiar"}
      style={
        rotulo
          ? {
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 11,
              padding: "5px 10px",
              flex: "none",
              color: cor.destaque,
              background: cor.destaqueFundo,
            }
          : {
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 22,
              height: 22,
              padding: 0,
              flex: "none",
              color: cor.textoTerciario,
              background: "transparent",
            }
      }
    >
      <IconeCopiar />
      {rotulo}
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

// Input de texto com máscara aplicada a cada tecla (moeda, quantidade em
// milhar) — reformatar o valor sozinho, num input controlado, faz o cursor
// pular pro fim a cada keystroke (comportamento padrão do React quando o
// value muda de tamanho). Sem corrigir isso, digitar no meio de um valor
// já preenchido (ex.: editar "167,63" pra virar "1.167,63") empurra os
// próximos caracteres pro final, onde acabam descartados pela máscara —
// parece que o campo "trava" num valor pequeno. Aqui a posição é restaurada
// depois de cada reformatação.
export function CampoMascarado({
  valor,
  onChange,
  formatar,
  style,
  placeholder,
}: {
  valor: string;
  onChange: (valorFormatado: string) => void;
  formatar: (valorDigitado: string) => string;
  style?: React.CSSProperties;
  placeholder?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function aoDigitar(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const cursorAntes = input.selectionStart ?? input.value.length;
    const comprimentoAntes = input.value.length;
    const formatado = formatar(input.value);
    onChange(formatado);
    requestAnimationFrame(() => {
      if (!inputRef.current) return;
      const diferenca = formatado.length - comprimentoAntes;
      const posicao = Math.max(0, cursorAntes + diferenca);
      inputRef.current.setSelectionRange(posicao, posicao);
    });
  }

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="decimal"
      value={valor}
      onChange={aoDigitar}
      placeholder={placeholder}
      style={style}
    />
  );
}
