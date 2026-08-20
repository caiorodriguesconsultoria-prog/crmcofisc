"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Andamento = {
  id: string;
  tipo: string;
  texto: string;
  data: string;
  sei_numero: string | null;
  autor: { nome: string } | null;
};

export default function Andamentos({
  processoId,
  autorId,
  andamentos,
}: {
  processoId: string;
  autorId: string | null;
  andamentos: Andamento[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [tipo, setTipo] = useState("");
  const [texto, setTexto] = useState("");
  const [seiNumero, setSeiNumero] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setSalvando(true);

    const { error } = await supabase.from("andamentos").insert({
      processo_id: processoId,
      tipo,
      texto,
      sei_numero: seiNumero || null,
      autor_id: autorId,
    });

    setSalvando(false);

    if (error) {
      setErro(error.message);
      return;
    }

    setTipo("");
    setTexto("");
    setSeiNumero("");
    router.refresh();
  }

  return (
    <section style={{ marginTop: 24 }}>
      <h2 style={{ fontSize: 16 }}>Andamentos</h2>

      <ul style={{ marginTop: 8, padding: 0, listStyle: "none" }}>
        {andamentos.length === 0 && (
          <li style={{ color: "#7D7979" }}>Nenhum andamento registrado.</li>
        )}
        {andamentos.map((a) => (
          <li key={a.id} style={{ borderBottom: "1px solid #eee", padding: "8px 0" }}>
            <div style={{ fontSize: 12, color: "#7D7979" }}>
              {new Date(a.data).toLocaleString("pt-BR")} · {a.tipo}
              {a.autor?.nome ? ` · ${a.autor.nome}` : ""}
              {a.sei_numero ? ` · SEI ${a.sei_numero}` : ""}
            </div>
            <div>{a.texto}</div>
          </li>
        ))}
      </ul>

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}
      >
        <input
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          placeholder="Tipo (ex.: Ofício, E-mail, Nota)"
          required
          style={{ padding: 8 }}
        />
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Descreva o andamento"
          required
          style={{ padding: 8 }}
        />
        <input
          value={seiNumero}
          onChange={(e) => setSeiNumero(e.target.value)}
          placeholder="Nº SEI (opcional)"
          style={{ padding: 8 }}
        />
        {erro && <p style={{ color: "#B0655C" }}>{erro}</p>}
        <button type="submit" disabled={salvando}>
          {salvando ? "Salvando..." : "Registrar andamento"}
        </button>
      </form>
    </section>
  );
}
