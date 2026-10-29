"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { cor, raio } from "@/lib/theme";

// Busca única do Painel — substitui o título grande. Atalho Ctrl+K (Cmd+K
// no Mac) foca o campo, exceto quando a pessoa já está digitando em outro
// campo de texto, pra não disputar o atalho com formulários normais. Por
// enquanto só navega pra /processos com o termo (filtro que já existe lá);
// não cria busca nova no banco. Ver design-system/REGRAS.md.
export default function BuscaGlobal({ valorInicial = "" }: { valorInicial?: string }) {
  const router = useRouter();
  const [valor, setValor] = useState(valorInicial);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function aoApertarTecla(e: KeyboardEvent) {
      const alvo = e.target as HTMLElement | null;
      const digitando =
        alvo && (alvo.tagName === "INPUT" || alvo.tagName === "TEXTAREA" || alvo.isContentEditable);
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k" && !digitando) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", aoApertarTecla);
    return () => window.removeEventListener("keydown", aoApertarTecla);
  }, []);

  function aoSubmeter(e: React.FormEvent) {
    e.preventDefault();
    const termo = valor.trim();
    router.push(termo ? `/processos?q=${encodeURIComponent(termo)}` : "/processos");
  }

  return (
    <form onSubmit={aoSubmeter} style={{ position: "relative", width: "100%", maxWidth: 440 }}>
      <Search
        size={16}
        style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: cor.textoTerciario, pointerEvents: "none" }}
      />
      <input
        ref={inputRef}
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        placeholder="Buscar contrato, NUP ou objeto..."
        style={{
          width: "100%",
          padding: "11px 56px 11px 38px",
          borderRadius: raio.pilula,
          border: `1px solid ${cor.borda}`,
          background: cor.fundo,
          // 16px, não 14 — campo menor que isso faz o Safari no iPhone dar
          // zoom automático ao focar (Etapa 6, revisão mobile).
          fontSize: 16,
        }}
      />
      <kbd
        style={{
          position: "absolute",
          right: 10,
          top: "50%",
          transform: "translateY(-50%)",
          fontSize: 10.5,
          fontWeight: 600,
          color: cor.textoTerciario,
          border: `1px solid ${cor.borda}`,
          borderRadius: 5,
          padding: "3px 6px",
          background: cor.branco,
        }}
      >
        Ctrl K
      </kbd>
    </form>
  );
}
