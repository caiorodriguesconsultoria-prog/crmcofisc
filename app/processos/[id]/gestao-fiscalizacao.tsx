"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Pessoa = { id: string; nome: string } | null;
type Opcao = { id: string; nome: string };

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
      <div style={{ marginTop: 16 }}>
        <strong>Gestão e Fiscalização</strong>
        <p style={{ margin: "4px 0" }}>
          Gestor: {gestor?.nome ?? "não informado"}
          {gestorSubstituto && <> · Substituto: {gestorSubstituto.nome}</>}
          <br />
          Fiscal: {fiscal?.nome ?? "não informado"}
          {fiscalSubstituto && <> · Substituto: {fiscalSubstituto.nome}</>}
        </p>
        <button onClick={() => setEditando(true)}>Editar</button>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
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
      {erro && <p style={{ color: "#B0655C" }}>{erro}</p>}
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={salvar} disabled={salvando}>
          Salvar
        </button>
        <button onClick={() => setEditando(false)} disabled={salvando}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
