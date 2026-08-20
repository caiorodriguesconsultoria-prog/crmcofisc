"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function NovoFornecedorForm() {
  const router = useRouter();
  const supabase = createClient();

  const [nome, setNome] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [endereco, setEndereco] = useState("");
  const [preposto, setPreposto] = useState("");
  const [telefone, setTelefone] = useState("");
  const [emails, setEmails] = useState([{ email: "", rotulo: "" }]);
  const [bancoConta, setBancoConta] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  function atualizarEmail(i: number, campo: "email" | "rotulo", valor: string) {
    setEmails((atual) => atual.map((e, idx) => (idx === i ? { ...e, [campo]: valor } : e)));
  }

  function adicionarEmail() {
    setEmails((atual) => [...atual, { email: "", rotulo: "" }]);
  }

  function removerEmail(i: number) {
    setEmails((atual) => atual.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setSalvando(true);

    const { data: fornecedor, error: erroFornecedor } = await supabase
      .from("fornecedores")
      .insert({
        nome,
        cnpj,
        endereco: endereco || null,
        preposto: preposto || null,
        telefone: telefone || null,
        banco_conta: bancoConta || null,
      })
      .select("id")
      .single();

    if (erroFornecedor || !fornecedor) {
      setErro(erroFornecedor?.message ?? "Erro ao criar fornecedor.");
      setSalvando(false);
      return;
    }

    const emailsPreenchidos = emails.filter((e) => e.email.trim() !== "");
    if (emailsPreenchidos.length > 0) {
      const { error: erroEmails } = await supabase.from("fornecedor_emails").insert(
        emailsPreenchidos.map((e) => ({
          fornecedor_id: fornecedor.id,
          email: e.email.trim(),
          rotulo: e.rotulo.trim() || null,
        })),
      );
      if (erroEmails) {
        setErro(erroEmails.message);
        setSalvando(false);
        return;
      }
    }

    router.push("/fornecedores");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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
        CNPJ
        <input
          value={cnpj}
          onChange={(e) => setCnpj(e.target.value)}
          required
          style={{ display: "block", width: "100%", padding: 8 }}
        />
      </label>
      <label>
        Endereço
        <input
          value={endereco}
          onChange={(e) => setEndereco(e.target.value)}
          style={{ display: "block", width: "100%", padding: 8 }}
        />
      </label>
      <label>
        Preposto
        <input
          value={preposto}
          onChange={(e) => setPreposto(e.target.value)}
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
      <div>
        <span>E-mails</span>
        {emails.map((e, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <input
              type="email"
              placeholder="E-mail"
              value={e.email}
              onChange={(ev) => atualizarEmail(i, "email", ev.target.value)}
              style={{ flex: 2, padding: 8 }}
            />
            <input
              placeholder="Rótulo (opcional, ex.: Comercial)"
              value={e.rotulo}
              onChange={(ev) => atualizarEmail(i, "rotulo", ev.target.value)}
              style={{ flex: 1, padding: 8 }}
            />
            {emails.length > 1 && (
              <button type="button" onClick={() => removerEmail(i)}>
                remover
              </button>
            )}
          </div>
        ))}
        <button type="button" onClick={adicionarEmail} style={{ marginTop: 8 }}>
          + Adicionar e-mail
        </button>
      </div>
      <label>
        Banco / conta
        <input
          value={bancoConta}
          onChange={(e) => setBancoConta(e.target.value)}
          style={{ display: "block", width: "100%", padding: 8 }}
        />
      </label>
      {erro && <p style={{ color: "#B0655C" }}>{erro}</p>}
      <button type="submit" disabled={salvando} style={{ padding: 10 }}>
        {salvando ? "Salvando..." : "Criar fornecedor"}
      </button>
    </form>
  );
}
