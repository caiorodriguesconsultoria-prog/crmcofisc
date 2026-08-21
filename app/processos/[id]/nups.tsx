"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Nup = { id: string; tipo: "relatorio" | "pagamento"; valor: string };

const ROTULOS: Record<string, string> = {
  relatorio: "NUP Relatório",
  pagamento: "NUP Pagamentos",
};

export default function Nups({
  processoId,
  nupRelatorio,
  nupPagamento,
}: {
  processoId: string;
  nupRelatorio: Nup | null;
  nupPagamento: Nup | null;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [editando, setEditando] = useState<"relatorio" | "pagamento" | null>(null);
  const [valor, setValor] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  function abrirEdicao(tipo: "relatorio" | "pagamento", atual: Nup | null) {
    setEditando(tipo);
    setValor(atual?.valor ?? "");
    setErro(null);
  }

  async function salvar(tipo: "relatorio" | "pagamento", atual: Nup | null) {
    setErro(null);
    setSalvando(true);
    const { error } = atual
      ? await supabase.from("processo_nups").update({ nup: valor.trim() }).eq("id", atual.id)
      : await supabase
          .from("processo_nups")
          .insert({ processo_id: processoId, tipo, nup: valor.trim() });
    setSalvando(false);
    if (error) {
      setErro(error.message);
      return;
    }
    setEditando(null);
    router.refresh();
  }

  function linha(tipo: "relatorio" | "pagamento", atual: Nup | null) {
    if (editando === tipo) {
      return (
        <div key={tipo} style={{ display: "flex", gap: 8, marginTop: 4 }}>
          <input
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            style={{ padding: 6, flex: 1 }}
          />
          <button onClick={() => salvar(tipo, atual)} disabled={salvando || !valor.trim()}>
            Salvar
          </button>
          <button onClick={() => setEditando(null)} disabled={salvando}>
            Cancelar
          </button>
        </div>
      );
    }
    return (
      <div key={tipo} style={{ marginTop: 4 }}>
        {ROTULOS[tipo]}: {atual?.valor ?? "não informado"}{" "}
        <button onClick={() => abrirEdicao(tipo, atual)}>Editar</button>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 16 }}>
      <strong>NUPs</strong>
      {linha("relatorio", nupRelatorio)}
      {linha("pagamento", nupPagamento)}
      {erro && <p style={{ color: "#B0655C" }}>{erro}</p>}
    </div>
  );
}
