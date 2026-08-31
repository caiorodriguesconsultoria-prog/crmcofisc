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
  isAdmin,
}: {
  coordenacoes: Opcao[];
  fornecedores: Opcao[];
  tags: Opcao[];
  pessoas: Opcao[];
  gestores: PessoaPapel[];
  fiscais: PessoaPapel[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();

  const formaEntregaTags = tags.filter((t) => t.categoria === "forma_entrega");

  const [gestoresState, setGestoresState] = useState(gestores);
  const [fiscaisState, setFiscaisState] = useState(fiscais);
  const [fornecedoresState, setFornecedoresState] = useState(fornecedores);
  const [criandoGestor, setCriandoGestor] = useState(false);
  const [nomeNovoGestor, setNomeNovoGestor] = useState("");
  const [matriculaNovoGestor, setMatriculaNovoGestor] = useState("");
  const [criandoFiscal, setCriandoFiscal] = useState(false);
  const [nomeNovoFiscal, setNomeNovoFiscal] = useState("");
  const [matriculaNovoFiscal, setMatriculaNovoFiscal] = useState("");
  const [criandoFornecedor, setCriandoFornecedor] = useState(false);
  const [nomeNovoFornecedor, setNomeNovoFornecedor] = useState("");
  const [cnpjNovoFornecedor, setCnpjNovoFornecedor] = useState("");
  const [erroInline, setErroInline] = useState<string | null>(null);

  async function criarGestor() {
    if (!nomeNovoGestor.trim() || !matriculaNovoGestor.trim()) return;
    setErroInline(null);
    const { data: pessoa, error: erroPessoa } = await supabase
      .from("pessoas")
      .insert({ nome: nomeNovoGestor.trim(), matricula: matriculaNovoGestor.trim() })
      .select("id, nome")
      .single();
    if (erroPessoa || !pessoa) {
      setErroInline(erroPessoa?.message ?? "Erro ao criar gestor.");
      return;
    }
    const { error: erroPapel } = await supabase.from("pessoa_papeis").insert({ pessoa_id: pessoa.id, papel: "gestor" });
    if (erroPapel) {
      setErroInline(erroPapel.message);
      return;
    }
    setGestoresState((atual) => [...atual, pessoa]);
    setGestorId(pessoa.id);
    setNomeNovoGestor("");
    setMatriculaNovoGestor("");
    setCriandoGestor(false);
  }

  async function criarFiscal() {
    if (!nomeNovoFiscal.trim() || !matriculaNovoFiscal.trim()) return;
    setErroInline(null);
    const { data: pessoa, error: erroPessoa } = await supabase
      .from("pessoas")
      .insert({ nome: nomeNovoFiscal.trim(), matricula: matriculaNovoFiscal.trim() })
      .select("id, nome")
      .single();
    if (erroPessoa || !pessoa) {
      setErroInline(erroPessoa?.message ?? "Erro ao criar fiscal.");
      return;
    }
    const { error: erroPapel } = await supabase.from("pessoa_papeis").insert({ pessoa_id: pessoa.id, papel: "fiscal" });
    if (erroPapel) {
      setErroInline(erroPapel.message);
      return;
    }
    setFiscaisState((atual) => [...atual, pessoa]);
    setFiscalId(pessoa.id);
    setNomeNovoFiscal("");
    setMatriculaNovoFiscal("");
    setCriandoFiscal(false);
  }

  async function criarFornecedor() {
    if (!nomeNovoFornecedor.trim()) return;
    setErroInline(null);
    const { data: fornecedor, error } = await supabase
      .from("fornecedores")
      .insert({ nome: nomeNovoFornecedor.trim(), cnpj: cnpjNovoFornecedor.trim() || null })
      .select("id, nome")
      .single();
    if (error || !fornecedor) {
      setErroInline(error?.message ?? "Erro ao criar fornecedor.");
      return;
    }
    setFornecedoresState((atual) => [...atual, fornecedor]);
    setFornecedorId(fornecedor.id);
    setNomeNovoFornecedor("");
    setCnpjNovoFornecedor("");
    setCriandoFornecedor(false);
  }

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
          {gestoresState.map((g) => (
            <option key={g.id} value={g.id}>
              {g.nome}
            </option>
          ))}
        </select>
      </label>
      {isAdmin && (criandoGestor ? (
        <div style={{ display: "flex", gap: 8 }}>
          <input
            autoFocus
            value={nomeNovoGestor}
            onChange={(e) => setNomeNovoGestor(e.target.value)}
            placeholder="Nome"
            style={{ padding: 8, flex: 2, minWidth: 0 }}
          />
          <input
            value={matriculaNovoGestor}
            onChange={(e) => setMatriculaNovoGestor(e.target.value)}
            placeholder="Matrícula"
            style={{ padding: 8, flex: 1, minWidth: 0 }}
          />
          <button type="button" onClick={criarGestor} disabled={!nomeNovoGestor.trim() || !matriculaNovoGestor.trim()}>
            Criar
          </button>
          <button type="button" onClick={() => { setCriandoGestor(false); setNomeNovoGestor(""); setMatriculaNovoGestor(""); }}>
            Cancelar
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => setCriandoGestor(true)} style={{ alignSelf: "flex-start" }}>
          + Novo gestor
        </button>
      ))}
      <label>
        Gestor substituto
        <select
          value={gestorSubstitutoId}
          onChange={(e) => setGestorSubstitutoId(e.target.value)}
          style={{ display: "block", width: "100%", padding: 8 }}
        >
          <option value="">Não informado</option>
          {gestoresState.map((g) => (
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
          {fiscaisState.map((f) => (
            <option key={f.id} value={f.id}>
              {f.nome}
            </option>
          ))}
        </select>
      </label>
      {isAdmin && (criandoFiscal ? (
        <div style={{ display: "flex", gap: 8 }}>
          <input
            autoFocus
            value={nomeNovoFiscal}
            onChange={(e) => setNomeNovoFiscal(e.target.value)}
            placeholder="Nome"
            style={{ padding: 8, flex: 2, minWidth: 0 }}
          />
          <input
            value={matriculaNovoFiscal}
            onChange={(e) => setMatriculaNovoFiscal(e.target.value)}
            placeholder="Matrícula"
            style={{ padding: 8, flex: 1, minWidth: 0 }}
          />
          <button type="button" onClick={criarFiscal} disabled={!nomeNovoFiscal.trim() || !matriculaNovoFiscal.trim()}>
            Criar
          </button>
          <button type="button" onClick={() => { setCriandoFiscal(false); setNomeNovoFiscal(""); setMatriculaNovoFiscal(""); }}>
            Cancelar
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => setCriandoFiscal(true)} style={{ alignSelf: "flex-start" }}>
          + Novo fiscal
        </button>
      ))}
      <label>
        Fiscal substituto
        <select
          value={fiscalSubstitutoId}
          onChange={(e) => setFiscalSubstitutoId(e.target.value)}
          style={{ display: "block", width: "100%", padding: 8 }}
        >
          <option value="">Não informado</option>
          {fiscaisState.map((f) => (
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
          {fornecedoresState.map((f) => (
            <option key={f.id} value={f.id}>
              {f.nome}
            </option>
          ))}
        </select>
      </label>
      {isAdmin && (criandoFornecedor ? (
        <div style={{ display: "flex", gap: 8 }}>
          <input
            autoFocus
            value={nomeNovoFornecedor}
            onChange={(e) => setNomeNovoFornecedor(e.target.value)}
            placeholder="Nome"
            style={{ padding: 8, flex: 2, minWidth: 0 }}
          />
          <input
            value={cnpjNovoFornecedor}
            onChange={(e) => setCnpjNovoFornecedor(e.target.value)}
            placeholder="CNPJ (opcional)"
            style={{ padding: 8, flex: 1, minWidth: 0 }}
          />
          <button type="button" onClick={criarFornecedor} disabled={!nomeNovoFornecedor.trim()}>
            Criar
          </button>
          <button type="button" onClick={() => { setCriandoFornecedor(false); setNomeNovoFornecedor(""); setCnpjNovoFornecedor(""); }}>
            Cancelar
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => setCriandoFornecedor(true)} style={{ alignSelf: "flex-start" }}>
          + Novo fornecedor
        </button>
      ))}
      {erroInline && <p style={{ color: "#B0655C" }}>{erroInline}</p>}
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
