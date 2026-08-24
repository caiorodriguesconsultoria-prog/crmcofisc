"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { botaoPrimario, card, cor } from "@/lib/theme";

type Coordenacao = { id: string; sigla: string };

export default function NovaPessoaPapelForm({
  papel,
  titulo,
  voltarHref,
  coordenacoes,
}: {
  papel: "gestor" | "fiscal";
  titulo: string;
  voltarHref: string;
  coordenacoes: Coordenacao[];
}) {
  const router = useRouter();
  const supabase = createClient();

  const [nome, setNome] = useState("");
  const [matricula, setMatricula] = useState("");
  const [email, setEmail] = useState("");
  const [coordenacaoId, setCoordenacaoId] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setSalvando(true);

    const { data: pessoa, error: erroPessoa } = await supabase
      .from("pessoas")
      .insert({ nome, matricula, email })
      .select("id")
      .single();

    if (erroPessoa || !pessoa) {
      setErro(erroPessoa?.message ?? "Erro ao criar cadastro.");
      setSalvando(false);
      return;
    }

    const { error: erroPapel } = await supabase.from("pessoa_papeis").insert({
      pessoa_id: pessoa.id,
      coordenacao_id: coordenacaoId,
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
    <main style={{ padding: 32, maxWidth: 480, margin: "0 auto" }}>
      <h1 style={{ fontSize: 20, marginBottom: 16 }}>{titulo}</h1>
      <form onSubmit={handleSubmit} style={{ ...card, display: "flex", flexDirection: "column", gap: 12 }}>
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
          Matrícula
          <input
            value={matricula}
            onChange={(e) => setMatricula(e.target.value)}
            required
            style={{ display: "block", width: "100%", padding: 8 }}
          />
        </label>
        <label>
          E-mail
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ display: "block", width: "100%", padding: 8 }}
          />
        </label>
        <label>
          Coordenação
          <select
            value={coordenacaoId}
            onChange={(e) => setCoordenacaoId(e.target.value)}
            required
            style={{ display: "block", width: "100%", padding: 8 }}
          >
            <option value="">Selecione</option>
            {coordenacoes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.sigla}
              </option>
            ))}
          </select>
        </label>
        {erro && <p style={{ color: cor.urgente }}>{erro}</p>}
        <button type="submit" disabled={salvando} style={botaoPrimario}>
          {salvando ? "Salvando..." : "Criar cadastro"}
        </button>
      </form>
    </main>
  );
}
