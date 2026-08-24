"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { botaoPrimario, card, cor } from "@/lib/theme";
import { BotaoCopiar } from "@/app/_ui/campo";

type Responsavel = { id: string; papelId: string; nome: string; email: string | null; ramal: string | null; papel: "coordenador" | "substituto" };

type Coordenacao = {
  id: string;
  sigla: string;
  nome: string;
  emailGenerico: string | null;
  telefone: string | null;
  responsaveis: Responsavel[];
};

async function copiar(texto: string) {
  try {
    await navigator.clipboard.writeText(texto);
  } catch {
    // sem permissão de clipboard — ignora silenciosamente
  }
}

function rotuloPapel(papel: string) {
  return papel === "coordenador" ? "Coordenador" : "Substituto";
}

function Card({ coordenacao, isAdmin }: { coordenacao: Coordenacao; isAdmin: boolean }) {
  const router = useRouter();
  const supabase = createClient();
  const c = coordenacao;

  const [editando, setEditando] = useState(false);
  const [nome, setNome] = useState(c.nome);
  const [emailGenerico, setEmailGenerico] = useState(c.emailGenerico ?? "");
  const [telefone, setTelefone] = useState(c.telefone ?? "");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [carregando, setCarregando] = useState<string | null>(null);

  const [novoResp, setNovoResp] = useState(false);
  const [respNome, setRespNome] = useState("");
  const [respEmail, setRespEmail] = useState("");
  const [respRamal, setRespRamal] = useState("");
  const [respPapel, setRespPapel] = useState<"coordenador" | "substituto">("coordenador");

  async function salvar() {
    setErro(null);
    setSalvando(true);
    const { error } = await supabase
      .from("coordenacoes")
      .update({ nome, email_generico: emailGenerico || null, telefone: telefone || null })
      .eq("id", c.id);
    setSalvando(false);
    if (error) {
      setErro(error.message);
      return;
    }
    setEditando(false);
    router.refresh();
  }

  async function adicionarResponsavel() {
    if (!respNome.trim() || !respEmail.trim()) return;
    setErro(null);
    setCarregando("novo");
    const { data: pessoa, error: erroPessoa } = await supabase
      .from("pessoas")
      .insert({ nome: respNome.trim(), email: respEmail.trim(), ramal: respRamal.trim() || null })
      .select("id")
      .single();
    if (erroPessoa || !pessoa) {
      setErro(erroPessoa?.message ?? "Erro ao criar responsável.");
      setCarregando(null);
      return;
    }
    const { error: erroPapel } = await supabase
      .from("pessoa_papeis")
      .insert({ pessoa_id: pessoa.id, coordenacao_id: c.id, papel: respPapel });
    setCarregando(null);
    if (erroPapel) {
      setErro(erroPapel.message);
      return;
    }
    setNovoResp(false);
    setRespNome("");
    setRespEmail("");
    setRespRamal("");
    setRespPapel("coordenador");
    router.refresh();
  }

  async function removerResponsavel(papelId: string) {
    setErro(null);
    setCarregando(papelId);
    const { error } = await supabase.from("pessoa_papeis").delete().eq("id", papelId);
    setCarregando(null);
    if (error) {
      setErro(error.message);
      return;
    }
    router.refresh();
  }

  function copiarEmails() {
    const emails = c.responsaveis.map((r) => r.email).filter((e): e is string => !!e);
    copiar(emails.join("; "));
  }

  return (
    <div style={{ ...card, display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <span style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 8, background: cor.destaqueFundo, color: cor.destaque }}>
          {c.sigla}
        </span>
        <span style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.25 }}>{c.nome}</span>
      </div>

      {erro && <p style={{ color: cor.urgente, fontSize: 12, margin: 0 }}>{erro}</p>}

      {!editando ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Campo label="Coordenação" valor={`${c.nome} - ${c.sigla}`} />
          <Campo label="E-mail institucional" valor={c.emailGenerico ?? "não informado"} />
          <Campo label="Telefone" valor={c.telefone ?? "não informado"} />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <label>
            Nome
            <input value={nome} onChange={(e) => setNome(e.target.value)} style={{ display: "block", width: "100%", padding: 6 }} />
          </label>
          <label>
            E-mail institucional
            <input value={emailGenerico} onChange={(e) => setEmailGenerico(e.target.value)} style={{ display: "block", width: "100%", padding: 6 }} />
          </label>
          <label>
            Telefone
            <input value={telefone} onChange={(e) => setTelefone(e.target.value)} style={{ display: "block", width: "100%", padding: 6 }} />
          </label>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span style={{ fontSize: 10.5, fontWeight: 500, textTransform: "uppercase", letterSpacing: 1, color: cor.textoTerciario }}>
          Responsáveis
        </span>
        {c.responsaveis.map((r) => (
          <div key={r.papelId} style={{ borderBottom: `1px solid ${cor.borda}`, paddingBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <span style={{ fontSize: 12.5, fontWeight: 600 }}>{r.nome}</span>
              <span style={{ fontSize: 10.5, fontWeight: 600, color: cor.textoTerciario, background: "rgba(96,93,93,.12)", borderRadius: 7, padding: "3px 8px" }}>
                {rotuloPapel(r.papel)}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: cor.textoSecundario, marginTop: 2 }}>
              <span>{r.email ?? "—"}</span>
              {r.email && <BotaoCopiar texto={r.email} />}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: cor.textoSecundario, marginTop: 2 }}>
              <span>Ramal {r.ramal ?? "—"}</span>
              {r.ramal && <BotaoCopiar texto={r.ramal} />}
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => removerResponsavel(r.papelId)}
                  disabled={carregando === r.papelId}
                  style={{ marginLeft: "auto", fontSize: 10.5 }}
                >
                  remover
                </button>
              )}
            </div>
          </div>
        ))}

        {isAdmin &&
          (novoResp ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, background: cor.fundo, borderRadius: 10, padding: 10 }}>
              <input placeholder="Nome" value={respNome} onChange={(e) => setRespNome(e.target.value)} />
              <input placeholder="E-mail" value={respEmail} onChange={(e) => setRespEmail(e.target.value)} />
              <input placeholder="Ramal" value={respRamal} onChange={(e) => setRespRamal(e.target.value)} />
              <select value={respPapel} onChange={(e) => setRespPapel(e.target.value as "coordenador" | "substituto")}>
                <option value="coordenador">Coordenador(a)</option>
                <option value="substituto">Substituto(a)</option>
              </select>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={adicionarResponsavel} disabled={carregando === "novo" || !respNome.trim() || !respEmail.trim()} style={{ ...botaoPrimario, fontSize: 11, padding: "6px 12px" }}>
                  Salvar
                </button>
                <button onClick={() => setNovoResp(false)} disabled={carregando === "novo"} style={{ fontSize: 11 }}>
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setNovoResp(true)}
              style={{ fontSize: 12, color: cor.textoTerciario, borderStyle: "dashed" }}
            >
              + Cadastrar responsável
            </button>
          ))}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        {isAdmin && !editando && (
          <button type="button" onClick={() => setEditando(true)} style={{ flex: 1, fontSize: 12 }}>
            Editar
          </button>
        )}
        {editando && (
          <>
            <button type="button" onClick={salvar} disabled={salvando} style={{ flex: 1, fontSize: 12 }}>
              {salvando ? "Salvando..." : "Salvar"}
            </button>
            <button type="button" onClick={() => setEditando(false)} disabled={salvando} style={{ flex: 1, fontSize: 12 }}>
              Cancelar
            </button>
          </>
        )}
        {!editando && (
          <button
            type="button"
            onClick={copiarEmails}
            disabled={c.responsaveis.length === 0}
            style={{ flex: 1, fontSize: 12, color: cor.destaque, background: cor.destaqueFundo }}
          >
            Copiar e-mails
          </button>
        )}
      </div>
    </div>
  );
}

function Campo({ label, valor }: { label: string; valor: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: 10.5, fontWeight: 500, textTransform: "uppercase", letterSpacing: 1, color: cor.textoTerciario }}>
        {label}
      </span>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, fontSize: 12.5, fontWeight: 500 }}>
        <span>{valor}</span>
        <BotaoCopiar texto={valor} />
      </div>
    </div>
  );
}

export default function GradeCoordenacoes({
  coordenacoes,
  isAdmin,
}: {
  coordenacoes: Coordenacao[];
  isAdmin: boolean;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: 16,
        marginTop: 16,
        alignItems: "start",
      }}
    >
      {coordenacoes.map((c) => (
        <Card key={c.id} coordenacao={c} isAdmin={isAdmin} />
      ))}
    </div>
  );
}
