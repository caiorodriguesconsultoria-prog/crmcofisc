"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { botaoPrimario, cor, PALETA_VIVA } from "@/lib/theme";
import { BotaoCopiar } from "@/app/_ui/campo";
import CardBento from "@/app/_ui/card-bento";

type MembroEquipe = { id: string; papelId: string; nome: string; email: string | null; ramal: string | null };

type Coordenacao = {
  id: string;
  sigla: string;
  nome: string;
  telefone: string | null;
  coordenadorNome: string | null;
  coordenadorEmail: string | null;
  equipe: MembroEquipe[];
};

async function copiar(texto: string) {
  try {
    await navigator.clipboard.writeText(texto);
  } catch {
    // sem permissão de clipboard — ignora silenciosamente
  }
}

function Card({ coordenacao, isAdmin, indice }: { coordenacao: Coordenacao; isAdmin: boolean; indice: number }) {
  const router = useRouter();
  const supabase = createClient();
  const c = coordenacao;

  const [editando, setEditando] = useState(false);
  const [nome, setNome] = useState(c.nome);
  const [telefone, setTelefone] = useState(c.telefone ?? "");
  const [coordenadorNome, setCoordenadorNome] = useState(c.coordenadorNome ?? "");
  const [coordenadorEmail, setCoordenadorEmail] = useState(c.coordenadorEmail ?? "");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [carregando, setCarregando] = useState<string | null>(null);

  const [novoMembro, setNovoMembro] = useState(false);
  const [membroNome, setMembroNome] = useState("");
  const [membroEmail, setMembroEmail] = useState("");
  const [membroRamal, setMembroRamal] = useState("");

  async function salvar() {
    setErro(null);
    setSalvando(true);
    const { error } = await supabase
      .from("coordenacoes")
      .update({
        nome,
        telefone: telefone || null,
        coordenador_nome: coordenadorNome || null,
        coordenador_email: coordenadorEmail || null,
      })
      .eq("id", c.id);
    setSalvando(false);
    if (error) {
      setErro(error.message);
      return;
    }
    setEditando(false);
    router.refresh();
  }

  async function adicionarMembro() {
    if (!membroNome.trim() || !membroEmail.trim()) return;
    setErro(null);
    setCarregando("novo");
    const { data: pessoa, error: erroPessoa } = await supabase
      .from("pessoas")
      .insert({ nome: membroNome.trim(), email: membroEmail.trim(), ramal: membroRamal.trim() || null })
      .select("id")
      .single();
    if (erroPessoa || !pessoa) {
      setErro(erroPessoa?.message ?? "Erro ao criar membro da equipe.");
      setCarregando(null);
      return;
    }
    const { error: erroPapel } = await supabase
      .from("pessoa_papeis")
      .insert({ pessoa_id: pessoa.id, coordenacao_id: c.id, papel: "equipe" });
    setCarregando(null);
    if (erroPapel) {
      setErro(erroPapel.message);
      return;
    }
    setNovoMembro(false);
    setMembroNome("");
    setMembroEmail("");
    setMembroRamal("");
    router.refresh();
  }

  async function removerMembro(papelId: string) {
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
    const emails = c.equipe.map((r) => r.email).filter((e): e is string => !!e);
    copiar(emails.join("; "));
  }

  return (
    <CardBento indice={indice} vidroClaro corAcento={PALETA_VIVA[indice % PALETA_VIVA.length]}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
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
          <Campo label="Telefone" valor={c.telefone ?? "não informado"} />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <label>
            Nome
            <input value={nome} onChange={(e) => setNome(e.target.value)} style={{ display: "block", width: "100%", padding: 6 }} />
          </label>
          <label>
            Telefone
            <input value={telefone} onChange={(e) => setTelefone(e.target.value)} style={{ display: "block", width: "100%", padding: 6 }} />
          </label>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={{ fontSize: 10.5, fontWeight: 500, textTransform: "uppercase", letterSpacing: 1, color: cor.textoTerciario }}>
          Coordenador
        </span>
        {!editando ? (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, fontSize: 12.5, fontWeight: 500 }}>
              <span>{c.coordenadorNome || "não informado"}</span>
              {c.coordenadorNome && <BotaoCopiar texto={c.coordenadorNome} />}
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, fontSize: 12, color: cor.textoSecundario }}>
              <span>{c.coordenadorEmail || "e-mail não informado"}</span>
              {c.coordenadorEmail && <BotaoCopiar texto={c.coordenadorEmail} />}
            </div>
          </>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <input
              placeholder="Nome do coordenador"
              value={coordenadorNome}
              onChange={(e) => setCoordenadorNome(e.target.value)}
              style={{ padding: 6 }}
            />
            <input
              placeholder="E-mail do coordenador"
              value={coordenadorEmail}
              onChange={(e) => setCoordenadorEmail(e.target.value)}
              style={{ padding: 6 }}
            />
          </div>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span style={{ fontSize: 10.5, fontWeight: 500, textTransform: "uppercase", letterSpacing: 1, color: cor.textoTerciario }}>
          Equipe
        </span>
        {c.equipe.map((r) => (
          <div key={r.papelId} style={{ borderBottom: `1px solid ${cor.borda}`, paddingBottom: 8 }}>
            <span style={{ fontSize: 12.5, fontWeight: 600 }}>{r.nome}</span>
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
                  onClick={() => removerMembro(r.papelId)}
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
          (novoMembro ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, background: cor.fundo, borderRadius: 10, padding: 10 }}>
              <input placeholder="Nome" value={membroNome} onChange={(e) => setMembroNome(e.target.value)} />
              <input placeholder="E-mail" value={membroEmail} onChange={(e) => setMembroEmail(e.target.value)} />
              <input placeholder="Ramal" value={membroRamal} onChange={(e) => setMembroRamal(e.target.value)} />
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={adicionarMembro} disabled={carregando === "novo" || !membroNome.trim() || !membroEmail.trim()} style={{ ...botaoPrimario, fontSize: 11, padding: "6px 12px" }}>
                  Salvar
                </button>
                <button onClick={() => setNovoMembro(false)} disabled={carregando === "novo"} style={{ fontSize: 11 }}>
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setNovoMembro(true)}
              style={{ fontSize: 12, color: cor.textoTerciario, borderStyle: "dashed" }}
            >
              + Cadastrar membro da equipe
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
            disabled={c.equipe.length === 0}
            style={{ flex: 1, fontSize: 12, color: cor.destaque, background: cor.destaqueFundo }}
          >
            Copiar e-mails
          </button>
        )}
      </div>
      </div>
    </CardBento>
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
    // Colunas CSS (não grid) de propósito — os cards têm alturas bem
    // diferentes (depende de quantos membros de equipe cada coordenação
    // tem), e um grid comum deixava o card mais baixo "sozinho" numa
    // linha nova em vez de ficar ao lado dos outros (pedido do Caio pra
    // corrigir). Colunas CSS fluem os cards um embaixo do outro dentro de
    // cada coluna, como um mosaico, sem o vão que o grid deixava.
    <div
      style={{
        columnWidth: 320,
        columnGap: 16,
        marginTop: 16,
      }}
    >
      {coordenacoes.map((c, i) => (
        <div key={c.id} style={{ breakInside: "avoid", marginBottom: 16 }}>
          <Card coordenacao={c} isAdmin={isAdmin} indice={i} />
        </div>
      ))}
    </div>
  );
}
