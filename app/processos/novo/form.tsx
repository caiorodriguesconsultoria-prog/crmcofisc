"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { verificarPessoaDuplicada, garantirPessoaComPapel } from "@/lib/verificar-pessoa-duplicada";

type Opcao = { id: string; nome?: string; sigla?: string; valor?: string; categoria?: string };
type PessoaPapel = { id: string; nome: string };

export default function NovoProcessoForm({
  coordenacoes,
  fornecedores,
  tags,
  responsaveis,
  gestores,
  fiscais,
  isAdmin,
}: {
  coordenacoes: Opcao[];
  fornecedores: Opcao[];
  tags: Opcao[];
  responsaveis: PessoaPapel[];
  gestores: PessoaPapel[];
  fiscais: PessoaPapel[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();

  const formaEntregaTags = tags.filter((t) => t.categoria === "forma_entrega");

  const [responsaveisState, setResponsaveisState] = useState(responsaveis);
  const [criandoResponsavel, setCriandoResponsavel] = useState(false);
  const [nomeNovoResponsavel, setNomeNovoResponsavel] = useState("");
  const [avisoResponsavel, setAvisoResponsavel] = useState<string | null>(null);
  const [gestoresState, setGestoresState] = useState(gestores);
  const [fiscaisState, setFiscaisState] = useState(fiscais);
  const [fornecedoresState, setFornecedoresState] = useState(fornecedores);
  const [criandoGestor, setCriandoGestor] = useState(false);
  const [nomeNovoGestor, setNomeNovoGestor] = useState("");
  const [matriculaNovoGestor, setMatriculaNovoGestor] = useState("");
  const [avisoGestor, setAvisoGestor] = useState<string | null>(null);
  const [criandoFiscal, setCriandoFiscal] = useState(false);
  const [nomeNovoFiscal, setNomeNovoFiscal] = useState("");
  const [matriculaNovoFiscal, setMatriculaNovoFiscal] = useState("");
  const [avisoFiscal, setAvisoFiscal] = useState<string | null>(null);
  const [criandoFornecedor, setCriandoFornecedor] = useState(false);
  const [nomeNovoFornecedor, setNomeNovoFornecedor] = useState("");
  const [cnpjNovoFornecedor, setCnpjNovoFornecedor] = useState("");
  const [erroInline, setErroInline] = useState<string | null>(null);

  async function checarDuplicadoResponsavel() {
    setAvisoResponsavel(await verificarPessoaDuplicada(supabase, nomeNovoResponsavel, ""));
  }

  async function criarResponsavel() {
    if (!nomeNovoResponsavel.trim()) return;
    setErroInline(null);
    const resultado = await garantirPessoaComPapel(supabase, nomeNovoResponsavel, "", "responsavel");
    if ("erro" in resultado) {
      setErroInline(resultado.erro);
      return;
    }
    setResponsaveisState((atual) => (atual.some((p) => p.id === resultado.id) ? atual : [...atual, resultado]));
    setTitularId(resultado.id);
    setNomeNovoResponsavel("");
    setAvisoResponsavel(null);
    setCriandoResponsavel(false);
  }

  async function checarDuplicadoGestor() {
    setAvisoGestor(await verificarPessoaDuplicada(supabase, nomeNovoGestor, matriculaNovoGestor));
  }

  async function checarDuplicadoFiscal() {
    setAvisoFiscal(await verificarPessoaDuplicada(supabase, nomeNovoFiscal, matriculaNovoFiscal));
  }

  async function criarGestor() {
    if (!nomeNovoGestor.trim() || !matriculaNovoGestor.trim()) return;
    setErroInline(null);
    const resultado = await garantirPessoaComPapel(supabase, nomeNovoGestor, matriculaNovoGestor, "gestor");
    if ("erro" in resultado) {
      setErroInline(resultado.erro);
      return;
    }
    setGestoresState((atual) => (atual.some((p) => p.id === resultado.id) ? atual : [...atual, resultado]));
    setGestorId(resultado.id);
    setNomeNovoGestor("");
    setMatriculaNovoGestor("");
    setAvisoGestor(null);
    setCriandoGestor(false);
  }

  async function criarFiscal() {
    if (!nomeNovoFiscal.trim() || !matriculaNovoFiscal.trim()) return;
    setErroInline(null);
    const resultado = await garantirPessoaComPapel(supabase, nomeNovoFiscal, matriculaNovoFiscal, "fiscal");
    if ("erro" in resultado) {
      setErroInline(resultado.erro);
      return;
    }
    setFiscaisState((atual) => (atual.some((p) => p.id === resultado.id) ? atual : [...atual, resultado]));
    setFiscalId(resultado.id);
    setNomeNovoFiscal("");
    setMatriculaNovoFiscal("");
    setAvisoFiscal(null);
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
  const [unidadeMedida, setUnidadeMedida] = useState("");
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

  // Itens do contrato — um contrato pode ter vários (ex.: dois tipos de
  // insumo no mesmo contrato, cada um com sua própria quantidade/valor e
  // cronograma de entrega). Parcelas de cada item são cadastradas depois,
  // na tela do contrato (Cronograma de entregas) — aqui só o essencial pra
  // já nascer com os itens certos.
  type ParcelaForm = { numero: number; quantidade: number; data_prevista: string | null };
  type ItemForm = {
    descricao: string;
    catmat: string;
    unidade_medida: string;
    quantidade: string;
    valor_unitario: string;
    // Só preenchido pela extração de PDF — sem campo de edição nesta tela
    // (mesmo padrão dos itens: parcelas se conferem/ajustam depois, no
    // Cronograma de entregas do contrato).
    parcelas: ParcelaForm[];
  };
  const itemVazio = (): ItemForm => ({
    descricao: "",
    catmat: "",
    unidade_medida: "",
    quantidade: "",
    valor_unitario: "",
    parcelas: [],
  });
  const [itens, setItens] = useState<ItemForm[]>([itemVazio()]);

  function atualizarItem(indice: number, campo: keyof ItemForm, valor: string) {
    setItens((atual) => atual.map((it, i) => (i === indice ? { ...it, [campo]: valor } : it)));
  }
  function adicionarItem() {
    setItens((atual) => [...atual, itemVazio()]);
  }
  function removerItem(indice: number) {
    setItens((atual) => atual.filter((_, i) => i !== indice));
  }

  function paraNumeroOuNull(v: string): number | null {
    const normalizado = v.trim().replace(/\./g, "").replace(",", ".");
    if (!normalizado) return null;
    const n = Number(normalizado);
    return Number.isFinite(n) ? n : null;
  }

  // Extração automática via upload do PDF do contrato (API do Claude) — só
  // pré-preenche; o Caio confere tudo antes de salvar. Campos do Quadro
  // Resumitivo que não têm input visível aqui (Processo Eletrônico, Pregão,
  // vigência, valores, etc.) ficam guardados em `extraExtraido` e são
  // gravados junto na criação do contrato, mesmo sem campo próprio nesta
  // tela — dá pra conferir/editar depois na aba Relatório do contrato.
  const [extraindoPdf, setExtraindoPdf] = useState(false);
  const [erroPdf, setErroPdf] = useState<string | null>(null);
  const [extraExtraido, setExtraExtraido] = useState<Record<string, unknown> | null>(null);

  async function processarPdf(arquivo: File) {
    setErroPdf(null);
    setExtraindoPdf(true);
    try {
      const formData = new FormData();
      formData.append("arquivo", arquivo);
      const resp = await fetch("/api/processos/extrair-pdf", { method: "POST", body: formData });
      const corpo = await resp.json();
      if (!resp.ok) {
        setErroPdf(corpo.error ?? "Não deu pra extrair os dados do PDF.");
        return;
      }
      const dados = corpo.dados as Record<string, any>;

      if (dados.numero_contrato) setNumeroContrato(dados.numero_contrato);
      if (dados.nup_principal) setNup(dados.nup_principal);
      if (dados.objeto) setObjeto(dados.objeto);
      if (dados.unidade_medida) setUnidadeMedida(dados.unidade_medida);

      if (Array.isArray(dados.itens) && dados.itens.length > 0) {
        setItens(
          dados.itens.map((it: any) => ({
            descricao: it.descricao ?? "",
            catmat: it.catmat ?? "",
            unidade_medida: it.unidade_medida ?? "",
            quantidade: it.quantidade != null ? String(it.quantidade) : "",
            valor_unitario: it.valor_unitario != null ? String(it.valor_unitario) : "",
            parcelas: Array.isArray(it.parcelas)
              ? it.parcelas
                  .filter((p: any) => p.numero != null && p.quantidade != null)
                  .map((p: any) => ({
                    numero: Number(p.numero),
                    quantidade: Number(p.quantidade),
                    data_prevista: p.data_prevista ?? null,
                  }))
              : [],
          })),
        );
      }

      const {
        numero_contrato: _nc,
        nup_principal: _np,
        objeto: _ob,
        unidade_medida: _um,
        itens: _it,
        ...resto
      } = dados;
      setExtraExtraido(resto);
    } catch {
      setErroPdf("Não deu pra extrair os dados do PDF.");
    } finally {
      setExtraindoPdf(false);
    }
  }

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
        ...(extraExtraido ?? {}),
        numero_contrato: numeroContrato,
        nup_principal: nup,
        objeto,
        unidade_medida: unidadeMedida.trim() || null,
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
      setErro(erroProcesso?.message ?? "Erro ao criar contrato.");
      setSalvando(false);
      return;
    }

    // Todo contrato precisa nascer com pelo menos 1 item — se a seção de
    // itens ficou toda em branco, cai num único item usando o Objeto já
    // digitado (mesmo padrão da migração que converteu os contratos antigos).
    const itensPreenchidos = itens.filter((it) => it.descricao.trim());
    const itensParaSalvar = itensPreenchidos.length > 0 ? itensPreenchidos : [{ ...itemVazio(), descricao: objeto }];

    const { data: itensCriados, error: erroItens } = await supabase
      .from("processo_itens")
      .insert(
        itensParaSalvar.map((it, i) => ({
          processo_id: processo.id,
          numero: i + 1,
          descricao: it.descricao.trim() || objeto,
          catmat: it.catmat.trim() || null,
          unidade_medida: it.unidade_medida.trim() || null,
          quantidade: paraNumeroOuNull(it.quantidade),
          valor_unitario: paraNumeroOuNull(it.valor_unitario),
        })),
      )
      .select("id, numero");
    if (erroItens || !itensCriados) {
      setErro(erroItens?.message ?? "Erro ao criar itens do contrato.");
      setSalvando(false);
      return;
    }

    // Parcelas extraídas do PDF (cronograma de entrega) — opcional, só
    // existe quando a extração conseguiu ler a tabela de parcelas de algum
    // item. Itens criados manualmente (sem PDF) não têm parcelas aqui; elas
    // são cadastradas depois, no Cronograma de entregas do contrato.
    const idPorNumeroItem = new Map(itensCriados.map((i) => [i.numero, i.id]));
    const parcelasParaSalvar = itensParaSalvar.flatMap((it, i) => {
      const itemId = idPorNumeroItem.get(i + 1);
      if (!itemId) return [];
      return it.parcelas.map((p) => ({
        processo_id: processo.id,
        item_id: itemId,
        numero: p.numero,
        quantidade: p.quantidade,
        data_prevista: p.data_prevista,
      }));
    });
    if (parcelasParaSalvar.length > 0) {
      const { error: erroParcelas } = await supabase.from("processo_execucoes").insert(parcelasParaSalvar);
      if (erroParcelas) {
        setErro(erroParcelas.message);
        setSalvando(false);
        return;
      }
    }

    router.push("/processos");
    router.refresh();
  }

  const ROTULOS_EXTRAIDOS: Record<string, string> = {
    processo_eletronico_numero: "Processo Eletrônico nº",
    pregao_eletronico_numero: "Pregão Eletrônico nº",
    ata_registro_precos_numero: "Ata de Registro de Preços nº",
    data_assinatura: "Data da Assinatura",
    vigencia_inicio: "Vigência (início)",
    vigencia_fim: "Vigência (fim)",
    publicacao_dou: "Publicação D.O.U",
    publicacao_pncp: "Publicação PNCP",
    valor_global: "Valor Global do Contrato",
    valor_garantia: "Valor da Garantia",
    portaria_designacao_fiscal: "Portaria Designação de Fiscal",
    nota_empenho_numero: "Nota de Empenho nº",
    programa_trabalho: "Programa de Trabalho",
    natureza_despesa: "Natureza de Despesa",
    local_entrega: "Local de Entrega",
  };
  const extraidosPreenchidos = extraExtraido
    ? Object.entries(extraExtraido).filter(([, v]) => v !== null && v !== undefined && v !== "")
    : [];

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ border: "1px dashed #ccc", borderRadius: 8, padding: 12 }}>
        <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
          Anexar contrato (PDF ou foto/imagem) — preenche os campos automaticamente
        </label>
        <input
          type="file"
          accept="application/pdf,image/png,image/jpeg,image/webp,.xlsx,.xls"
          disabled={extraindoPdf}
          onChange={(e) => {
            const arquivo = e.target.files?.[0];
            if (arquivo) processarPdf(arquivo);
            e.target.value = "";
          }}
        />
        {extraindoPdf && <p style={{ fontSize: 12.5, color: "#605D5D", margin: "6px 0 0" }}>Lendo o PDF, aguarde...</p>}
        {erroPdf && <p style={{ fontSize: 12.5, color: "#B0655C", margin: "6px 0 0" }}>{erroPdf}</p>}
        {extraidosPreenchidos.length > 0 && (
          <div style={{ marginTop: 8, fontSize: 12.5 }}>
            <p style={{ margin: "0 0 4px", color: "#605D5D" }}>
              Também extraído (sem campo aqui — confira depois na aba Relatório do contrato):
            </p>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {extraidosPreenchidos.map(([chave, valor]) => (
                <li key={chave}>
                  {ROTULOS_EXTRAIDOS[chave] ?? chave}: <strong>{String(valor)}</strong>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
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
        Unidade de medida
        <input
          value={unidadeMedida}
          onChange={(e) => setUnidadeMedida(e.target.value)}
          placeholder="ex.: frascos, caixas"
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
        <div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              autoFocus
              value={nomeNovoGestor}
              onChange={(e) => setNomeNovoGestor(e.target.value)}
              onBlur={checarDuplicadoGestor}
              placeholder="Nome"
              style={{ padding: 8, flex: 2, minWidth: 0 }}
            />
            <input
              value={matriculaNovoGestor}
              onChange={(e) => setMatriculaNovoGestor(e.target.value)}
              onBlur={checarDuplicadoGestor}
              placeholder="Matrícula"
              style={{ padding: 8, flex: 1, minWidth: 0 }}
            />
            <button type="button" onClick={criarGestor} disabled={!nomeNovoGestor.trim() || !matriculaNovoGestor.trim()}>
              Criar
            </button>
            <button type="button" onClick={() => { setCriandoGestor(false); setNomeNovoGestor(""); setMatriculaNovoGestor(""); setAvisoGestor(null); }}>
              Cancelar
            </button>
          </div>
          {avisoGestor && <p style={{ color: "#C08A3E", margin: "4px 0 0", fontSize: 12 }}>⚠ {avisoGestor}</p>}
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
        <div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              autoFocus
              value={nomeNovoFiscal}
              onChange={(e) => setNomeNovoFiscal(e.target.value)}
              onBlur={checarDuplicadoFiscal}
              placeholder="Nome"
              style={{ padding: 8, flex: 2, minWidth: 0 }}
            />
            <input
              value={matriculaNovoFiscal}
              onChange={(e) => setMatriculaNovoFiscal(e.target.value)}
              onBlur={checarDuplicadoFiscal}
              placeholder="Matrícula"
              style={{ padding: 8, flex: 1, minWidth: 0 }}
            />
            <button type="button" onClick={criarFiscal} disabled={!nomeNovoFiscal.trim() || !matriculaNovoFiscal.trim()}>
              Criar
            </button>
            <button type="button" onClick={() => { setCriandoFiscal(false); setNomeNovoFiscal(""); setMatriculaNovoFiscal(""); setAvisoFiscal(null); }}>
              Cancelar
            </button>
          </div>
          {avisoFiscal && <p style={{ color: "#C08A3E", margin: "4px 0 0", fontSize: 12 }}>⚠ {avisoFiscal}</p>}
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
          {responsaveisState.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </select>
      </label>
      {isAdmin && (criandoResponsavel ? (
        <div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              autoFocus
              value={nomeNovoResponsavel}
              onChange={(e) => setNomeNovoResponsavel(e.target.value)}
              onBlur={checarDuplicadoResponsavel}
              placeholder="Nome"
              style={{ padding: 8, flex: 1, minWidth: 0 }}
            />
            <button type="button" onClick={criarResponsavel} disabled={!nomeNovoResponsavel.trim()}>
              Criar
            </button>
            <button type="button" onClick={() => { setCriandoResponsavel(false); setNomeNovoResponsavel(""); setAvisoResponsavel(null); }}>
              Cancelar
            </button>
          </div>
          {avisoResponsavel && <p style={{ color: "#C08A3E", margin: "4px 0 0", fontSize: 12 }}>⚠ {avisoResponsavel}</p>}
        </div>
      ) : (
        <button type="button" onClick={() => setCriandoResponsavel(true)} style={{ alignSelf: "flex-start" }}>
          + Novo responsável
        </button>
      ))}
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
              {responsaveisState
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
      <div>
        <span style={{ fontWeight: 600 }}>Itens do contrato</span>
        <p style={{ fontSize: 12, color: "#7D7979", margin: "2px 0 8px" }}>
          Opcional — se deixar em branco, nasce com 1 item usando o Objeto acima. As parcelas de cada item são
          cadastradas depois, na tela do contrato.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {itens.map((item, i) => (
            <div
              key={i}
              style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end", border: "1px solid #eee", borderRadius: 8, padding: 10 }}
            >
              <label style={{ flex: "2 1 220px", minWidth: 0 }}>
                Descrição
                <input
                  value={item.descricao}
                  onChange={(e) => atualizarItem(i, "descricao", e.target.value)}
                  placeholder={`Ex.: item ${i + 1}`}
                  style={{ display: "block", width: "100%", padding: 8 }}
                />
              </label>
              <label style={{ flex: "1 1 100px", minWidth: 0 }}>
                CATMAT
                <input
                  value={item.catmat}
                  onChange={(e) => atualizarItem(i, "catmat", e.target.value)}
                  style={{ display: "block", width: "100%", padding: 8 }}
                />
              </label>
              <label style={{ flex: "1 1 120px", minWidth: 0 }}>
                Unidade
                <input
                  value={item.unidade_medida}
                  onChange={(e) => atualizarItem(i, "unidade_medida", e.target.value)}
                  placeholder="ex.: tubete 3 ml"
                  style={{ display: "block", width: "100%", padding: 8 }}
                />
              </label>
              <label style={{ flex: "1 1 110px", minWidth: 0 }}>
                Quantidade
                <input
                  value={item.quantidade}
                  onChange={(e) => atualizarItem(i, "quantidade", e.target.value)}
                  style={{ display: "block", width: "100%", padding: 8 }}
                />
              </label>
              <label style={{ flex: "1 1 110px", minWidth: 0 }}>
                Valor unitário (R$)
                <input
                  value={item.valor_unitario}
                  onChange={(e) => atualizarItem(i, "valor_unitario", e.target.value)}
                  placeholder="0,00"
                  style={{ display: "block", width: "100%", padding: 8 }}
                />
              </label>
              {itens.length > 1 && (
                <button type="button" onClick={() => removerItem(i)} style={{ padding: 8 }}>
                  remover
                </button>
              )}
              {item.parcelas.length > 0 && (
                <p style={{ flexBasis: "100%", fontSize: 11.5, color: "#7D7979", margin: "4px 0 0" }}>
                  {item.parcelas.length} parcela{item.parcelas.length > 1 ? "s" : ""} extraída
                  {item.parcelas.length > 1 ? "s" : ""} do PDF — confira/ajuste depois no Cronograma de entregas do
                  contrato.
                </p>
              )}
            </div>
          ))}
        </div>
        <button type="button" onClick={adicionarItem} style={{ marginTop: 8 }}>
          + Adicionar item
        </button>
      </div>

      {erro && <p style={{ color: "#B0655C" }}>{erro}</p>}
      <button type="submit" disabled={salvando} style={{ padding: 10 }}>
        {salvando ? "Salvando..." : "Criar contrato"}
      </button>
    </form>
  );
}
