"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Opcao = { id: string; nome?: string; sigla?: string; valor?: string; categoria?: string };
type PessoaPapel = { id: string; nome: string };

export default function NovoProcessoForm({
  coordenacoes,
  fornecedores,
  tags,
  pessoas,
  gestores,
  fiscais,
}: {
  coordenacoes: Opcao[];
  fornecedores: Opcao[];
  tags: Opcao[];
  pessoas: Opcao[];
  gestores: PessoaPapel[];
  fiscais: PessoaPapel[];
}) {
  const router = useRouter();
  const supabase = createClient();

  const formaEntregaTags = tags.filter((t) => t.categoria === "forma_entrega");

  const [numeroContrato, setNumeroContrato] = useState("");
  const [nup, setNup] = useState("");
  const [objeto, setObjeto] = useState("");
  const [coordenacaoId, setCoordenacaoId] = useState("");
  const [fornecedorId, setFornecedorId] = useState("");
  const [titularId, setTitularId] = useState("");
  const [emCobertura, setEmCobertura] = useState(false);
  const [responsavelAtualId, setResponsavelAtualId] = useState("");
  const [motivoBackup, setMotivoBackup] = useState("");
  const [formaEntregaId, setFormaEntregaId] = useState("");
  const [gestorId, setGestorId] = useState("");
  const [gestorSubstitutoId, setGestorSubstitutoId] = useState("");
  const [fiscalId, setFiscalId] = useState("");
  const [fiscalSubstitutoId, setFiscalSubstitutoId] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    if (emCobertura && (!responsavelAtualId || !motivoBackup.trim())) {
      setErro("Informe quem assume e o motivo da cobertura.");
      return;
    }

    setSalvando(true);

    const { data: processo, error: erroProcesso } = await supabase
      .from("processos")
      .insert({
        numero_contrato: numeroContrato,
        nup_principal: nup,
        objeto,
        coordenacao_id: coordenacaoId,
        fornecedor_id: fornecedorId,
        titular_id: titularId,
        responsavel_atual_id: emCobertura ? responsavelAtualId : titularId,
        motivo_backup: emCobertura ? motivoBackup.trim() : null,
        forma_entrega_tag_id: formaEntregaId || null,
        gestor_id: gestorId || null,
        gestor_substituto_id: gestorSubstitutoId || null,
        fiscal_id: fiscalId || null,
        fiscal_substituto_id: fiscalSubstitutoId || null,
      })
      .select("id")
      .single();

    if (erroProcesso || !processo) {
      setErro(erroProcesso?.message ?? "Erro ao criar processo.");
      setSalvando(false);
      return;
    }

    router.push("/processos");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <label>
        Nº do contrato
        <input
          value={numeroContrato}
          onChange={(e) => setNumeroContrato(e.target.value)}
          required
          style={{ display: "block", width: "100%", padding: 8 }}
        />
      </label>
      <label>
        NUP principal
        <input
          value={nup}
          onChange={(e) => setNup(e.target.value)}
          required
          style={{ display: "block", width: "100%", padding: 8 }}
        />
      </label>
      <label>
        Objeto
        <textarea
          value={objeto}
          onChange={(e) => setObjeto(e.target.value)}
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
      <label>
        Gestor
        <select
          value={gestorId}
          onChange={(e) => setGestorId(e.target.value)}
          style={{ display: "block", width: "100%", padding: 8 }}
        >
          <option value="">Não informado</option>
          {gestores.map((g) => (
            <option key={g.id} value={g.id}>
              {g.nome}
            </option>
          ))}
        </select>
      </label>
      <label>
        Gestor substituto
        <select
          value={gestorSubstitutoId}
          onChange={(e) => setGestorSubstitutoId(e.target.value)}
          style={{ display: "block", width: "100%", padding: 8 }}
        >
          <option value="">Não informado</option>
          {gestores.map((g) => (
            <option key={g.id} value={g.id}>
              {g.nome}
            </option>
          ))}
        </select>
      </label>
      <label>
        Fiscal
        <select
          value={fiscalId}
          onChange={(e) => setFiscalId(e.target.value)}
          style={{ display: "block", width: "100%", padding: 8 }}
        >
          <option value="">Não informado</option>
          {fiscais.map((f) => (
            <option key={f.id} value={f.id}>
              {f.nome}
            </option>
          ))}
        </select>
      </label>
      <label>
        Fiscal substituto
        <select
          value={fiscalSubstitutoId}
          onChange={(e) => setFiscalSubstitutoId(e.target.value)}
          style={{ display: "block", width: "100%", padding: 8 }}
        >
          <option value="">Não informado</option>
          {fiscais.map((f) => (
            <option key={f.id} value={f.id}>
              {f.nome}
            </option>
          ))}
        </select>
      </label>
      <label>
        Fornecedor
        <select
          value={fornecedorId}
          onChange={(e) => setFornecedorId(e.target.value)}
          required
          style={{ display: "block", width: "100%", padding: 8 }}
        >
          <option value="">Selecione</option>
          {fornecedores.map((f) => (
            <option key={f.id} value={f.id}>
              {f.nome}
            </option>
          ))}
        </select>
      </label>
      <label>
        Responsável (titular)
        <select
          value={titularId}
          onChange={(e) => setTitularId(e.target.value)}
          required
          style={{ display: "block", width: "100%", padding: 8 }}
        >
          <option value="">Selecione</option>
          {pessoas.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </select>
      </label>
      <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input
          type="checkbox"
          checked={emCobertura}
          onChange={(e) => setEmCobertura(e.target.checked)}
        />
        Abrir em cobertura (titular ausente)
      </label>
      {emCobertura && (
        <>
          <label>
            Quem assume agora
            <select
              value={responsavelAtualId}
              onChange={(e) => setResponsavelAtualId(e.target.value)}
              required
              style={{ display: "block", width: "100%", padding: 8 }}
            >
              <option value="">Selecione</option>
              {pessoas
                .filter((p) => p.id !== titularId)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
            </select>
          </label>
          <label>
            Motivo
            <input
              value={motivoBackup}
              onChange={(e) => setMotivoBackup(e.target.value)}
              placeholder="Ex.: férias, licença"
              required
              style={{ display: "block", width: "100%", padding: 8 }}
            />
          </label>
        </>
      )}
      <label>
        Forma de entrega
        <select
          value={formaEntregaId}
          onChange={(e) => setFormaEntregaId(e.target.value)}
          style={{ display: "block", width: "100%", padding: 8 }}
        >
          <option value="">Não informado</option>
          {formaEntregaTags.map((t) => (
            <option key={t.id} value={t.id}>
              {t.valor}
            </option>
          ))}
        </select>
      </label>
      {erro && <p style={{ color: "#B0655C" }}>{erro}</p>}
      <button type="submit" disabled={salvando} style={{ padding: 10 }}>
        {salvando ? "Salvando..." : "Criar processo"}
      </button>
    </form>
  );
}
