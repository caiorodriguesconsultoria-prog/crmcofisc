"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { botaoPrimario, cor } from "@/lib/theme";

export default function NovaCoordenacaoForm() {
  const router = useRouter();
  const supabase = createClient();

  const [sigla, setSigla] = useState("");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [coordenadorNome, setCoordenadorNome] = useState("");
  const [coordenadorEmail, setCoordenadorEmail] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setSalvando(true);

    const { error } = await supabase.from("coordenacoes").insert({
      sigla,
      nome,
      telefone: telefone || null,
      coordenador_nome: coordenadorNome || null,
      coordenador_email: coordenadorEmail || null,
    });

    if (error) {
      setErro(error.message);
      setSalvando(false);
      return;
    }

    router.push("/coordenacoes");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <label>
        Sigla
        <input
          value={sigla}
          onChange={(e) => setSigla(e.target.value)}
          required
          style={{ display: "block", width: "100%", padding: 8 }}
        />
      </label>
      <label>
        Nome
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
          style={{ display: "block", width: "100%", padding: 8 }}
        />
      </label>
      <label>
        Telefone
        <input
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
          style={{ display: "block", width: "100%", padding: 8 }}
        />
      </label>
      <label>
        Nome do coordenador
        <input
          value={coordenadorNome}
          onChange={(e) => setCoordenadorNome(e.target.value)}
          style={{ display: "block", width: "100%", padding: 8 }}
        />
      </label>
      <label>
        E-mail do coordenador
        <input
          type="email"
          value={coordenadorEmail}
          onChange={(e) => setCoordenadorEmail(e.target.value)}
          style={{ display: "block", width: "100%", padding: 8 }}
        />
      </label>
      {erro && <p style={{ color: cor.urgente }}>{erro}</p>}
      <button type="submit" disabled={salvando} style={botaoPrimario}>
        {salvando ? "Salvando..." : "Criar coordenação"}
      </button>
    </form>
  );
}
