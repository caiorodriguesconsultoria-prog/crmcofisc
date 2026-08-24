"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { card, cor } from "@/lib/theme";
import { BotaoCopiar } from "@/app/_ui/campo";

type Nup = { id: string; tipo: "relatorio" | "pagamento"; valor: string };

const ROTULOS: Record<string, string> = {
  relatorio: "NUP Relatório",
  pagamento: "NUP Pagamentos",
};

function Coluna({ label, valor, acao }: { label: string; valor: string; acao?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
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
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 600 }}>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{valor}</span>
        <BotaoCopiar texto={valor} />
        {acao}
      </div>
    </div>
  );
}

export default function DadosPrincipais({
  processoId,
  nupPrincipal,
  nupRelatorio,
  nupPagamento,
  fornecedorNome,
  cnpj,
  objeto,
}: {
  processoId: string;
  nupPrincipal: string;
  nupRelatorio: Nup | null;
  nupPagamento: Nup | null;
  fornecedorNome: string;
  cnpj: string;
  objeto: string;
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

  return (
    <div style={{ ...card, display: "flex", flexDirection: "column", gap: 14 }}>
      <span
        style={{
          fontSize: 11.5,
          fontWeight: 600,
          color: cor.destaque,
          letterSpacing: 0.6,
          textTransform: "uppercase",
        }}
      >
        Dados principais
      </span>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
        <Coluna label="NUP Principal" valor={nupPrincipal} />
        {editando === "relatorio" ? (
          <div style={{ display: "flex", gap: 6 }}>
            <input value={valor} onChange={(e) => setValor(e.target.value)} style={{ flex: 1, padding: 6 }} />
            <button onClick={() => salvar("relatorio", nupRelatorio)} disabled={salvando || !valor.trim()} style={{ fontSize: 11 }}>
              Salvar
            </button>
            <button onClick={() => setEditando(null)} disabled={salvando} style={{ fontSize: 11 }}>
              X
            </button>
          </div>
        ) : (
          <Coluna
            label="NUP Relatório"
            valor={nupRelatorio?.valor ?? "não informado"}
            acao={
              <button onClick={() => abrirEdicao("relatorio", nupRelatorio)} style={{ fontSize: 10, padding: "2px 6px" }}>
                editar
              </button>
            }
          />
        )}
        {editando === "pagamento" ? (
          <div style={{ display: "flex", gap: 6 }}>
            <input value={valor} onChange={(e) => setValor(e.target.value)} style={{ flex: 1, padding: 6 }} />
            <button onClick={() => salvar("pagamento", nupPagamento)} disabled={salvando || !valor.trim()} style={{ fontSize: 11 }}>
              Salvar
            </button>
            <button onClick={() => setEditando(null)} disabled={salvando} style={{ fontSize: 11 }}>
              X
            </button>
          </div>
        ) : (
          <Coluna
            label="NUP Pagamentos"
            valor={nupPagamento?.valor ?? "não informado"}
            acao={
              <button onClick={() => abrirEdicao("pagamento", nupPagamento)} style={{ fontSize: 10, padding: "2px 6px" }}>
                editar
              </button>
            }
          />
        )}
      </div>

      {erro && <p style={{ color: cor.urgente, margin: 0, fontSize: 12 }}>{erro}</p>}

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1.6fr", gap: 14 }}>
        <Coluna label="Contratada" valor={fornecedorNome || "não informado"} />
        <Coluna label="CNPJ" valor={cnpj || "não informado"} />
        <Coluna label="Objeto" valor={objeto} />
      </div>
    </div>
  );
}
