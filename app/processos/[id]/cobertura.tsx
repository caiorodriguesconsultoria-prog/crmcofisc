"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Pessoa = { id: string; nome: string };

export default function Cobertura({
  processoId,
  titular,
  responsavelAtual,
  motivoBackup,
  pessoas,
}: {
  processoId: string;
  titular: Pessoa;
  responsavelAtual: Pessoa;
  motivoBackup: string | null;
  pessoas: Pessoa[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [transferindo, setTransferindo] = useState(false);
  const [novoResponsavelId, setNovoResponsavelId] = useState("");
  const [motivo, setMotivo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  const emBackup = responsavelAtual.id !== titular.id;

  async function transferir() {
    if (!novoResponsavelId || !motivo.trim()) return;
    setErro(null);
    setCarregando(true);
    const { error } = await supabase
      .from("processos")
      .update({ responsavel_atual_id: novoResponsavelId, motivo_backup: motivo.trim() })
      .eq("id", processoId);
    setCarregando(false);
    if (error) {
      setErro(error.message);
      return;
    }
    setTransferindo(false);
    setNovoResponsavelId("");
    setMotivo("");
    router.refresh();
  }

  async function retornarAoTitular() {
    setErro(null);
    setCarregando(true);
    const { error } = await supabase
      .from("processos")
      .update({ responsavel_atual_id: titular.id, motivo_backup: null })
      .eq("id", processoId);
    setCarregando(false);
    if (error) {
      setErro(error.message);
      return;
    }
    router.refresh();
  }

  return (
    <div style={{ marginTop: 16 }}>
      <strong>Responsável</strong>
      <p style={{ margin: "4px 0" }}>
        Titular: {titular.nome}
        {emBackup && (
          <>
            <br />
            Responsável atual (cobertura): {responsavelAtual.nome}
            {motivoBackup && <> — {motivoBackup}</>}
          </>
        )}
      </p>

      {emBackup ? (
        <button onClick={retornarAoTitular} disabled={carregando}>
          Retornar ao titular
        </button>
      ) : !transferindo ? (
        <button onClick={() => setTransferindo(true)}>Transferir (cobertura de férias)</button>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
          <select
            value={novoResponsavelId}
            onChange={(e) => setNovoResponsavelId(e.target.value)}
            style={{ padding: 8 }}
          >
            <option value="">Selecione quem assume</option>
            {pessoas
              .filter((p) => p.id !== titular.id)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
          </select>
          <input
            placeholder="Motivo (ex.: férias, licença)"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            style={{ padding: 8 }}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={transferir}
              disabled={carregando || !novoResponsavelId || !motivo.trim()}
            >
              Confirmar
            </button>
            <button onClick={() => setTransferindo(false)} disabled={carregando}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {erro && <p style={{ color: "#B0655C" }}>{erro}</p>}
    </div>
  );
}
