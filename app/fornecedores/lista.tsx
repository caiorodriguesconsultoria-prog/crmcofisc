"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { botaoPrimario, cor, PALETA_VIVA } from "@/lib/theme";
import Painel from "@/app/_ui/painel";
import { BotaoCopiar } from "@/app/_ui/campo";
import CardBento from "@/app/_ui/card-bento";
type Email = { email: string; rotulo: string | null };
type Fornecedor = {
  id: string;
  nome: string;
  cnpj: string | null;
  preposto: string | null;
  telefone: string | null;
  fornecedor_emails: Email[];
};

export default function ListaFornecedores({
  fornecedores,
  isAdmin,
  erro,
}: {
  fornecedores: Fornecedor[];
  isAdmin: boolean;
  erro?: string;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [editando, setEditando] = useState<Fornecedor | null>(null);
  const [nome, setNome] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [preposto, setPreposto] = useState("");
  const [telefone, setTelefone] = useState("");
  const [emails, setEmails] = useState<Email[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [erroForm, setErroForm] = useState<string | null>(null);
  const [excluindoId, setExcluindoId] = useState<string | null>(null);

  function abrirEdicao(f: Fornecedor) {
    setEditando(f);
    setNome(f.nome);
    setCnpj(f.cnpj ?? "");
    setPreposto(f.preposto ?? "");
    setTelefone(f.telefone ?? "");
    setEmails(f.fornecedor_emails.length > 0 ? f.fornecedor_emails : [{ email: "", rotulo: "" }]);
    setErroForm(null);
  }

  function atualizarEmail(i: number, campo: "email" | "rotulo", valor: string) {
    setEmails((atual) => atual.map((e, idx) => (idx === i ? { ...e, [campo]: valor } : e)));
  }

  async function contarContratos(fornecedorId: string) {
    const { count } = await supabase
      .from("processos")
      .select("id", { count: "exact", head: true })
      .eq("fornecedor_id", fornecedorId);
    return count ?? 0;
  }

  async function salvarEdicao(e: React.FormEvent) {
    e.preventDefault();
    if (!editando) return;
    setErroForm(null);

    const totalContratos = await contarContratos(editando.id);
    if (totalContratos > 0) {
      const confirma = window.confirm(
        `Este fornecedor está vinculado a ${totalContratos} contrato${totalContratos > 1 ? "s" : ""}. ` +
          `A alteração vale pra todos eles (é o mesmo cadastro). Confirmar?`,
      );
      if (!confirma) return;
    }

    setSalvando(true);
    const { error: erroFornecedor } = await supabase
      .from("fornecedores")
      .update({ nome, cnpj: cnpj.trim() || null, preposto: preposto || null, telefone: telefone || null })
      .eq("id", editando.id);
    if (erroFornecedor) {
      setSalvando(false);
      setErroForm(erroFornecedor.message);
      return;
    }

    const { error: erroDelEmails } = await supabase
      .from("fornecedor_emails")
      .delete()
      .eq("fornecedor_id", editando.id);
    if (erroDelEmails) {
      setSalvando(false);
      setErroForm(erroDelEmails.message);
      return;
    }
    const emailsPreenchidos = emails.filter((e) => e.email.trim() !== "");
    if (emailsPreenchidos.length > 0) {
      const { error: erroEmails } = await supabase.from("fornecedor_emails").insert(
        emailsPreenchidos.map((e) => ({
          fornecedor_id: editando.id,
          email: e.email.trim(),
          rotulo: e.rotulo?.trim() || null,
        })),
      );
      if (erroEmails) {
        setSalvando(false);
        setErroForm(erroEmails.message);
        return;
      }
    }

    setSalvando(false);
    setEditando(null);
    router.refresh();
  }

  async function excluir(f: Fornecedor) {
    const totalContratos = await contarContratos(f.id);
    if (totalContratos > 0) {
      window.alert(
        `Não é possível excluir: ${totalContratos} contrato${totalContratos > 1 ? "s" : ""} ainda ${totalContratos > 1 ? "usam" : "usa"} esse fornecedor.`,
      );
      return;
    }
    if (!window.confirm(`Excluir o fornecedor ${f.nome}? Essa ação não pode ser desfeita.`)) return;
    setExcluindoId(f.id);
    const { error } = await supabase.from("fornecedores").delete().eq("id", f.id);
    setExcluindoId(null);
    if (error) {
      window.alert(error.message);
      return;
    }
    router.refresh();
  }

  return (
    <Painel
      titulo="Fornecedores"
      voltarHref="/dashboard"
      maxWidth={1000}
      fundoAurora
      acao={
        isAdmin && (
          <Link href="/fornecedores/novo" style={{ ...botaoPrimario, textDecoration: "none" }}>
            + Novo fornecedor
          </Link>
        )
      }
    >
      {erro && <p style={{ color: cor.urgente }}>Erro ao carregar: {erro}</p>}

      {fornecedores.length === 0 ? (
        <p style={{ color: cor.textoTerciario, marginTop: 10 }}>Nenhum fornecedor cadastrado.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16, marginTop: 10 }}>
          {fornecedores.map((f, i) => (
            <CardBento key={f.id} indice={i} vidroClaro corAcento={PALETA_VIVA[i % PALETA_VIVA.length]}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <Link href={`/fornecedores/${f.id}`} style={{ fontSize: 14, fontWeight: 700, color: cor.texto, textDecoration: "none" }}>
                  {f.nome}
                </Link>

                <div>
                  <div style={{ fontSize: 10.5, color: cor.textoTerciario, textTransform: "uppercase", letterSpacing: 0.4 }}>CNPJ</div>
                  <div style={{ fontSize: 12.5, color: cor.texto, marginTop: 1 }}>{f.cnpj || "—"}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10.5, color: cor.textoTerciario, textTransform: "uppercase", letterSpacing: 0.4 }}>Preposto</div>
                  <div style={{ fontSize: 12.5, color: cor.texto, marginTop: 1 }}>{f.preposto || "—"}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10.5, color: cor.textoTerciario, textTransform: "uppercase", letterSpacing: 0.4 }}>Telefone</div>
                  <div style={{ fontSize: 12.5, color: cor.texto, marginTop: 1 }}>{f.telefone || "—"}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10.5, color: cor.textoTerciario, textTransform: "uppercase", letterSpacing: 0.4 }}>E-mails</div>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 6, marginTop: 1 }}>
                    <span style={{ fontSize: 12.5, color: cor.texto, overflowWrap: "break-word" }}>
                      {(f.fornecedor_emails ?? []).length > 0
                        ? (f.fornecedor_emails ?? []).map((e) => (e.rotulo ? `${e.email} (${e.rotulo})` : e.email)).join(", ")
                        : "—"}
                    </span>
                    {(f.fornecedor_emails ?? []).length > 0 && (
                      <BotaoCopiar texto={(f.fornecedor_emails ?? []).map((e) => e.email).join("; ")} />
                    )}
                  </div>
                </div>

                {isAdmin && (
                  <div style={{ display: "flex", gap: 6, borderTop: `1px solid ${cor.borda}`, paddingTop: 10 }}>
                    <button
                      type="button"
                      onClick={() => abrirEdicao(f)}
                      title="Editar"
                      aria-label={`Editar ${f.nome}`}
                      style={{
                        fontSize: 10.5,
                        padding: "3px 9px",
                        borderRadius: 8,
                        border: "none",
                        background: "rgba(96,93,93,.10)",
                        color: cor.textoSecundario,
                      }}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      disabled={excluindoId === f.id}
                      onClick={() => excluir(f)}
                      title="Excluir"
                      aria-label={`Excluir ${f.nome}`}
                      style={{
                        fontSize: 10.5,
                        padding: "3px 9px",
                        borderRadius: 8,
                        border: "none",
                        background: cor.urgenteFundo,
                        color: cor.urgente,
                      }}
                    >
                      {excluindoId === f.id ? "..." : "Excluir"}
                    </button>
                  </div>
                )}
              </div>
            </CardBento>
          ))}
        </div>
      )}

      {editando && (
        <div
          onClick={() => setEditando(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 60,
            background: "rgba(32,31,29,.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: 18,
              width: "100%",
              maxWidth: 440,
              maxHeight: "85vh",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <strong style={{ fontSize: 13 }}>Editar fornecedor</strong>
              <button
                type="button"
                onClick={() => setEditando(null)}
                aria-label="Fechar"
                style={{ width: 26, height: 26, borderRadius: "50%", border: "none", background: "rgba(32,31,29,.08)" }}
              >
                ×
              </button>
            </div>

            <form onSubmit={salvarEdicao} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
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
                CNPJ (opcional)
                <input
                  value={cnpj}
                  onChange={(e) => setCnpj(e.target.value)}
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
                      placeholder="Rótulo (opcional)"
                      value={e.rotulo ?? ""}
                      onChange={(ev) => atualizarEmail(i, "rotulo", ev.target.value)}
                      style={{ flex: 1, padding: 8 }}
                    />
                    {emails.length > 1 && (
                      <button type="button" onClick={() => setEmails((a) => a.filter((_, idx) => idx !== i))}>
                        remover
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setEmails((a) => [...a, { email: "", rotulo: "" }])}
                  style={{ marginTop: 8 }}
                >
                  + Adicionar e-mail
                </button>
              </div>
              {erroForm && <p style={{ color: cor.urgente, margin: 0 }}>{erroForm}</p>}
              <button type="submit" disabled={salvando} style={botaoPrimario}>
                {salvando ? "Salvando..." : "Salvar"}
              </button>
            </form>
          </div>
        </div>
      )}
    </Painel>
  );
}
