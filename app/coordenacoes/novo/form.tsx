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
  const [emailGenerico, setEmailGenerico] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setSalvando(true);

    const { error } = await supabase.from("coordenacoes").insert({
      sigla,
      nome,
      email_generico: emailGenerico || null,
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
        E-mail genérico
        <input
          type="email"
          value={emailGenerico}
          onChange={(e) => setEmailGenerico(e.target.value)}
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
