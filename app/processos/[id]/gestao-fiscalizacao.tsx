"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { botaoPrimario, card, cor } from "@/lib/theme";
import { LinhaChave, BotaoCopiar } from "@/app/_ui/campo";
import CartaoColapsavel from "@/app/_ui/cartao-colapsavel";
import { estaAusente, periodoAusencia } from "@/lib/ausencia";

type Pessoa = { id: string; nome: string; ausencia_inicio?: string | null; ausencia_fim?: string | null } | null;
type Opcao = { id: string; nome: string };

function TagAusente({ inicio, fim }: { inicio: string; fim: string | null | undefined }) {
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        padding: "2px 7px",
        borderRadius: 10,
        color: cor.urgente,
        background: cor.urgenteFundo,
        marginLeft: 6,
        whiteSpace: "nowrap",
      }}
    >
      Ausente · {periodoAusencia(inicio, fim)}
    </span>
  );
}

export default function GestaoFiscalizacao({
  processoId,
  gestor,
  gestorSubstituto,
  fiscal,
  fiscalSubstituto,
  gestores,
  fiscais,
}: {
  processoId: string;
  gestor: Pessoa;
  gestorSubstituto: Pessoa;
  fiscal: Pessoa;
  fiscalSubstituto: Pessoa;
  gestores: Opcao[];
  fiscais: Opcao[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [editando, setEditando] = useState(false);
  const [gestorId, setGestorId] = useState(gestor?.id ?? "");
  const [gestorSubstitutoId, setGestorSubstitutoId] = useState(gestorSubstituto?.id ?? "");
  const [fiscalId, setFiscalId] = useState(fiscal?.id ?? "");
  const [fiscalSubstitutoId, setFiscalSubstitutoId] = useState(fiscalSubstituto?.id ?? "");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    setErro(null);
    setSalvando(true);
    const { error } = await supabase
      .from("processos")
      .update({
        gestor_id: gestorId || null,
        gestor_substituto_id: gestorSubstitutoId || null,
        fiscal_id: fiscalId || null,
        fiscal_substituto_id: fiscalSubstitutoId || null,
      })
      .eq("id", processoId);
    setSalvando(false);
    if (error) {
      setErro(error.message);
      return;
    }
    setEditando(false);
    router.refresh();
  }

  if (!editando) {
    return (
      <CartaoColapsavel titulo="Gestão e Fiscalização" abertoInicial={false}>
        <LinhaChave label="Gestor" valor={gestor?.nome ?? "não informado"} />
        <LinhaChave label="Gestor substituto" valor={gestorSubstituto?.nome ?? "não informado"} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "7px 0", borderBottom: `1px solid ${cor.borda}`, fontSize: 12.5 }}>
          <span style={{ color: cor.textoTerciario, flex: "none" }}>Fiscal</span>
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 600, textAlign: "right" }}>
            {fiscal?.nome ?? "não informado"}
            {fiscal && <BotaoCopiar texto={fiscal.nome} />}
            {fiscal && estaAusente(fiscal.ausencia_inicio, fiscal.ausencia_fim) && (
              <TagAusente inicio={fiscal.ausencia_inicio as string} fim={fiscal.ausencia_fim} />
            )}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "7px 0", borderBottom: `1px solid ${cor.borda}`, fontSize: 12.5 }}>
          <span style={{ color: cor.textoTerciario, flex: "none" }}>Fiscal substituto</span>
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 600, textAlign: "right" }}>
            {fiscalSubstituto?.nome ?? "não informado"}
            {fiscalSubstituto && <BotaoCopiar texto={fiscalSubstituto.nome} />}
            {fiscalSubstituto && estaAusente(fiscalSubstituto.ausencia_inicio, fiscalSubstituto.ausencia_fim) && (
              <TagAusente inicio={fiscalSubstituto.ausencia_inicio as string} fim={fiscalSubstituto.ausencia_fim} />
            )}
          </span>
        </div>
        <button onClick={() => setEditando(true)} style={{ marginTop: 10, fontSize: 11 }}>
          Editar
        </button>
      </CartaoColapsavel>
    );
  }

  return (
    <div style={{ ...card, display: "flex", flexDirection: "column", gap: 8 }}>
      <strong>Gestão e Fiscalização</strong>
      <label>
        Gestor
        <select
          value={gestorId}
          onChange={(e) => setGestorId(e.target.value)}
          style={{ display: "block", width: "100%", padding: 8 }}
        >
          <option value="">Não informado</option>
          {gestores.map((g) => (
            <option key={g.id} value={g.id}>
              {g.nome}
            </option>
          ))}
        </select>
      </label>
      <label>
        Gestor substituto
        <select
          value={gestorSubstitutoId}
          onChange={(e) => setGestorSubstitutoId(e.target.value)}
          style={{ display: "block", width: "100%", padding: 8 }}
        >
          <option value="">Não informado</option>
          {gestores.map((g) => (
            <option key={g.id} value={g.id}>
              {g.nome}
            </option>
          ))}
        </select>
      </label>
      <label>
        Fiscal
        <select
          value={fiscalId}
          onChange={(e) => setFiscalId(e.target.value)}
          style={{ display: "block", width: "100%", padding: 8 }}
        >
          <option value="">Não informado</option>
          {fiscais.map((f) => (
            <option key={f.id} value={f.id}>
              {f.nome}
            </option>
          ))}
        </select>
      </label>
      <label>
        Fiscal substituto
        <select
          value={fiscalSubstitutoId}
          onChange={(e) => setFiscalSubstitutoId(e.target.value)}
          style={{ display: "block", width: "100%", padding: 8 }}
        >
          <option value="">Não informado</option>
          {fiscais.map((f) => (
            <option key={f.id} value={f.id}>
              {f.nome}
            </option>
          ))}
        </select>
      </label>
      {erro && <p style={{ color: cor.urgente }}>{erro}</p>}
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={salvar} disabled={salvando} style={botaoPrimario}>
          Salvar
        </button>
        <button onClick={() => setEditando(false)} disabled={salvando}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
