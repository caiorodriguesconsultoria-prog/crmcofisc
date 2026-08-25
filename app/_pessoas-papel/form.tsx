"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { botaoPrimario, cor } from "@/lib/theme";
import Painel from "@/app/_ui/painel";

export default function NovaPessoaPapelForm({
  papel,
  titulo,
  voltarHref,
}: {
  papel: "gestor" | "fiscal";
  titulo: string;
  voltarHref: string;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [nome, setNome] = useState("");
  const [matricula, setMatricula] = useState("");
  const [ramal, setRamal] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setSalvando(true);

    const { data: pessoa, error: erroPessoa } = await supabase
      .from("pessoas")
      .insert({ nome, matricula, ramal: ramal || null })
      .select("id")
      .single();

    if (erroPessoa || !pessoa) {
      setErro(erroPessoa?.message ?? "Erro ao criar cadastro.");
      setSalvando(false);
      return;
    }

    const { error: erroPapel } = await supabase.from("pessoa_papeis").insert({
      pessoa_id: pessoa.id,
      papel,
    });

    if (erroPapel) {
      setErro(erroPapel.message);
      setSalvando(false);
      return;
    }

    router.push(voltarHref);
    router.refresh();
  }

  return (
    <Painel titulo={titulo} voltarHref={voltarHref} maxWidth={480}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <label>
          Nome completo
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
            style={{ display: "block", width: "100%", padding: 8 }}
          />
        </label>
        <label>
          Matrícula
          <input
            value={matricula}
            onChange={(e) => setMatricula(e.target.value)}
            required
            style={{ display: "block", width: "100%", padding: 8 }}
          />
        </label>
        <label>
          Ramal
          <input
            value={ramal}
            onChange={(e) => setRamal(e.target.value)}
            style={{ display: "block", width: "100%", padding: 8 }}
          />
        </label>
        {erro && <p style={{ color: cor.urgente }}>{erro}</p>}
        <button type="submit" disabled={salvando} style={botaoPrimario}>
          {salvando ? "Salvando..." : "Criar cadastro"}
        </button>
      </form>
    </Painel>
  );
}
