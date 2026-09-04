"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { botaoPrimario, cor } from "@/lib/theme";
import { verificarPessoaDuplicada, garantirPessoaComPapel } from "@/lib/verificar-pessoa-duplicada";
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
  const [avisoDuplicado, setAvisoDuplicado] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function checarDuplicado() {
    setAvisoDuplicado(await verificarPessoaDuplicada(supabase, nome, matricula));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setSalvando(true);

    const resultado = await garantirPessoaComPapel(supabase, nome, matricula, papel);
    setSalvando(false);
    if ("erro" in resultado) {
      setErro(resultado.erro);
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
            onBlur={checarDuplicado}
            required
            style={{ display: "block", width: "100%", padding: 8 }}
          />
        </label>
        <label>
          Matrícula
          <input
            value={matricula}
            onChange={(e) => setMatricula(e.target.value)}
            onBlur={checarDuplicado}
            required
            style={{ display: "block", width: "100%", padding: 8 }}
          />
        </label>
        {avisoDuplicado && (
          <p style={{ color: cor.atencao, margin: 0, fontSize: 12.5 }}>⚠ {avisoDuplicado}</p>
        )}
        {erro && <p style={{ color: cor.urgente }}>{erro}</p>}
        <button type="submit" disabled={salvando} style={botaoPrimario}>
          {salvando ? "Salvando..." : "Criar cadastro"}
        </button>
      </form>
    </Painel>
  );
}
