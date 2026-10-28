"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { valorPorExtenso } from "@/lib/extenso";
import { formatarMoedaBR, paraNumeroMoeda, moedaParaFormatado } from "@/lib/moeda";
import { BotaoCopiar, CampoMascarado } from "@/app/_ui/campo";

type Pessoa = { nome: string; matricula: string | null } | null;

type Item = {
  id: string;
  numero: number;
  descricao: string;
  catmat: string | null;
  unidade_medida: string | null;
  quantidade: number | null;
  valor_unitario: number | null;
};

type Processo = {
  id: string;
  numero_contrato: string;
  objeto: string;
  quantidade_contratada: string | null;
  data_assinatura: string | null;
  vigencia_inicio: string | null;
  vigencia_fim: string | null;
  processo_eletronico_numero: string | null;
  pregao_eletronico_numero: string | null;
  publicacao_pncp_pregao: string | null;
  ata_registro_precos_numero: string | null;
  publicacao_pncp_ata: string | null;
  publicacao_dou: string | null;
  publicacao_pncp: string | null;
  valor_unitario: number | null;
  valor_global: number | null;
  valor_garantia: number | null;
  portaria_designacao_fiscal: string | null;
  nota_empenho_numero: string | null;
  programa_trabalho: string | null;
  natureza_despesa: string | null;
  local_entrega: string | null;
  unidade_medida: string | null;
  fornecedores: { nome: string; cnpj: string } | null;
  gestor: Pessoa;
  gestor_substituto: Pessoa;
  fiscal: Pessoa;
  fiscal_substituto: Pessoa;
};

function formatarPessoa(p: Pessoa) {
  if (!p) return "não informado";
  return p.matricula ? `${p.nome} — matrícula SIAPE ${p.matricula}` : p.nome;
}

function formatarData(data: string | null) {
  return data ? new Date(`${data}T00:00:00`).toLocaleDateString("pt-BR") : "não informado";
}

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

// "Publicação D.O.U" e "Portaria Designação de Fiscal" têm um texto quase
// todo fixo (modelo padrão da COFISC) — só alguns números/datas mudam a
// cada contrato. Em vez de editar o texto inteiro à mão toda vez, só os
// pedaços variáveis são inputs; o texto final (o que de fato fica salvo em
// processos.publicacao_dou/portaria_designacao_fiscal) é montado sozinho.
function diaSemanaEExtenso(dataIso: string): { diaSemana: string; extenso: string } {
  const data = new Date(`${dataIso}T00:00:00`);
  const diaSemana = new Intl.DateTimeFormat("pt-BR", { weekday: "long" }).format(data);
  const extenso = `${data.getDate()} de ${MESES[data.getMonth()]} de ${data.getFullYear()}`;
  return { diaSemana, extenso };
}

function montarPublicacaoDou(edicao: string, pagina: string, data: string): string | null {
  if (!edicao.trim() || !pagina.trim() || !data) return null;
  const { diaSemana, extenso } = diaSemanaEExtenso(data);
  return `Edição nº ${edicao.trim()}, Seção 3, pág. ${pagina.trim()}, (${diaSemana}, ${extenso})`;
}

function parsePublicacaoDou(texto: string | null): { edicao: string; pagina: string; data: string } {
  const vazio = { edicao: "", pagina: "", data: "" };
  if (!texto) return vazio;
  const m = texto.match(
    /Edição nº (.+?), Seção 3, pág\.?\s*(.+?),\s*\([^,]+,\s*(\d{1,2}) de (\w+) de (\d{4})\)/i,
  );
  if (!m) return vazio;
  const mesIdx = MESES.findIndex((nome) => nome === m[4].toLowerCase());
  if (mesIdx === -1) return vazio;
  const dia = m[3].padStart(2, "0");
  const mes = String(mesIdx + 1).padStart(2, "0");
  return { edicao: m[1], pagina: m[2], data: `${m[5]}-${mes}-${dia}` };
}

function montarPortaria(
  numero: string,
  data: string,
  tipo: string,
  numeroTipo: string,
  dataTipo: string,
): string | null {
  if (!numero.trim() || !data || !numeroTipo.trim() || !dataTipo) return null;
  const { extenso } = diaSemanaEExtenso(data);
  return `Portaria CGLIS nº ${numero.trim()}, de ${extenso}; ${tipo} nº ${numeroTipo.trim()}, ${formatarData(dataTipo)}`;
}

function parsePortaria(
  texto: string | null,
): { numero: string; data: string; tipo: string; numeroTipo: string; dataTipo: string } {
  const vazio = { numero: "", data: "", tipo: "BGP", numeroTipo: "", dataTipo: "" };
  if (!texto) return vazio;
  const m = texto.match(
    /Portaria CGLIS nº (.+?), de (\d{1,2}) de (\w+) de (\d{4}); (BGP|BSE) nº (.+?),\s*(\d{2})\/(\d{2})\/(\d{4})/i,
  );
  if (!m) return vazio;
  const mesIdx = MESES.findIndex((nome) => nome === m[3].toLowerCase());
  if (mesIdx === -1) return vazio;
  const dia = m[2].padStart(2, "0");
  const mes = String(mesIdx + 1).padStart(2, "0");
  return {
    numero: m[1],
    data: `${m[4]}-${mes}-${dia}`,
    tipo: m[5].toUpperCase(),
    numeroTipo: m[6],
    dataTipo: `${m[9]}-${m[8]}-${m[7]}`,
  };
}

function formatarMoeda(valor: number | null) {
  return valor != null ? valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : null;
}

function extensoMoeda(valor: number | null) {
  if (valor == null) return null;
  return `(${valorPorExtenso(valor)})`;
}

type CampoTexto = {
  chave: keyof Omit<
    Processo,
    | "id"
    | "fornecedores"
    | "gestor"
    | "gestor_substituto"
    | "fiscal"
    | "fiscal_substituto"
    | "valor_unitario"
    | "valor_global"
    | "valor_garantia"
  >;
  label: string;
  span?: boolean;
  tipo?: "texto" | "data" | "textarea";
};

const CAMPOS: CampoTexto[] = [
  { chave: "processo_eletronico_numero", label: "Processo Eletrônico nº" },
  { chave: "pregao_eletronico_numero", label: "Pregão Eletrônico nº" },
  { chave: "publicacao_pncp_pregao", label: "Publicação PNCP (Pregão)" },
  { chave: "ata_registro_precos_numero", label: "Ata de Registro de Preços nº" },
  { chave: "publicacao_pncp_ata", label: "Publicação PNCP (Ata)" },
  { chave: "numero_contrato", label: "Contrato nº" },
  { chave: "publicacao_pncp", label: "Publicação PNCP (Contrato)" },
  { chave: "objeto", label: "Objeto", span: true, tipo: "textarea" },
  { chave: "data_assinatura", label: "Data da Assinatura", tipo: "data" },
  { chave: "nota_empenho_numero", label: "Nota de Empenho nº" },
  { chave: "programa_trabalho", label: "Programa de Trabalho" },
  { chave: "natureza_despesa", label: "Natureza de Despesa" },
  { chave: "local_entrega", label: "Local de Entrega" },
];

export default function QuadroResumitivo({
  processoId,
  processo,
  itens,
}: {
  processoId: string;
  processo: Processo;
  itens: Item[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [editando, setEditando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const [valores, setValores] = useState<Record<string, string>>(() => {
    const iniciais: Record<string, string> = {};
    for (const c of CAMPOS) {
      iniciais[c.chave] = (processo[c.chave] as string) ?? "";
    }
    iniciais.vigencia_inicio = processo.vigencia_inicio ?? "";
    iniciais.vigencia_fim = processo.vigencia_fim ?? "";
    iniciais.valor_global = moedaParaFormatado(processo.valor_global);
    iniciais.valor_garantia = moedaParaFormatado(processo.valor_garantia);
    iniciais.publicacao_dou = processo.publicacao_dou ?? "";
    iniciais.portaria_designacao_fiscal = processo.portaria_designacao_fiscal ?? "";
    return iniciais;
  });

  // Publicação D.O.U e Portaria Designação de Fiscal têm texto quase todo
  // fixo — só os pedaços abaixo são digitados, o texto final é montado
  // sozinho (ver montarPublicacaoDou/montarPortaria). Pré-preenchidos a
  // partir do texto já salvo quando possível (parsePublicacaoDou/parsePortaria).
  const [dou, setDou] = useState(() => parsePublicacaoDou(processo.publicacao_dou));
  const [portaria, setPortaria] = useState(() => parsePortaria(processo.portaria_designacao_fiscal));

  function atualizar(chave: string, valor: string) {
    setValores((atual) => ({ ...atual, [chave]: valor }));
  }

  function atualizarDou(parte: keyof typeof dou, valor: string) {
    const novo = { ...dou, [parte]: valor };
    setDou(novo);
    const composto = montarPublicacaoDou(novo.edicao, novo.pagina, novo.data);
    if (composto) atualizar("publicacao_dou", composto);
  }

  function atualizarPortaria(parte: keyof typeof portaria, valor: string) {
    const novo = { ...portaria, [parte]: valor };
    setPortaria(novo);
    const composto = montarPortaria(novo.numero, novo.data, novo.tipo, novo.numeroTipo, novo.dataTipo);
    if (composto) atualizar("portaria_designacao_fiscal", composto);
  }

  async function salvar() {
    setErro(null);
    setSalvando(true);
    const { error } = await supabase
      .from("processos")
      .update({
        processo_eletronico_numero: valores.processo_eletronico_numero || null,
        pregao_eletronico_numero: valores.pregao_eletronico_numero || null,
        publicacao_pncp_pregao: valores.publicacao_pncp_pregao || null,
        ata_registro_precos_numero: valores.ata_registro_precos_numero || null,
        publicacao_pncp_ata: valores.publicacao_pncp_ata || null,
        numero_contrato: valores.numero_contrato,
        objeto: valores.objeto,
        data_assinatura: valores.data_assinatura || null,
        vigencia_inicio: valores.vigencia_inicio || null,
        vigencia_fim: valores.vigencia_fim || null,
        publicacao_dou: valores.publicacao_dou || null,
        publicacao_pncp: valores.publicacao_pncp || null,
        valor_global: paraNumeroMoeda(valores.valor_global),
        valor_garantia: paraNumeroMoeda(valores.valor_garantia),
        portaria_designacao_fiscal: valores.portaria_designacao_fiscal || null,
        nota_empenho_numero: valores.nota_empenho_numero || null,
        programa_trabalho: valores.programa_trabalho || null,
        natureza_despesa: valores.natureza_despesa || null,
        local_entrega: valores.local_entrega || null,
      })
      .eq("id", processoId);
    setSalvando(false);
    if (error) {
      setErro(error.message);
      return;
    }
    setEditando(false);
    router.refresh();
  }

  function campoValor(chave: string, tipo: CampoTexto["tipo"]) {
    const valorAtual = processo[chave as keyof Processo] as string | null;
    if (!editando) {
      let texto: string;
      if (tipo === "data") texto = formatarData(valorAtual);
      else if (chave === "objeto" && valorAtual) {
        texto = processo.unidade_medida ? `${valorAtual}, ${processo.unidade_medida}` : valorAtual;
      } else {
        texto = valorAtual || "não informado";
      }
      if (!valorAtual) return texto;
      return (
        <span style={{ display: "inline-flex", alignItems: "flex-start", gap: 6 }}>
          {texto}
          <BotaoCopiar texto={texto} />
        </span>
      );
    }
    if (tipo === "textarea") {
      return (
        <textarea
          value={valores[chave]}
          onChange={(e) => atualizar(chave, e.target.value)}
          style={{ width: "100%", padding: 6 }}
        />
      );
    }
    return (
      <input
        type={tipo === "data" ? "date" : "text"}
        value={valores[chave]}
        onChange={(e) => atualizar(chave, e.target.value)}
        style={{ width: "100%", padding: 6 }}
      />
    );
  }

  // Salva sozinho assim que o foco sai de toda a área de edição (clicar em
  // outro lugar da página, fechar o processo, etc.) — não fica mais
  // dependendo de lembrar de clicar em "Salvar" antes de sair daqui.
  function aoPerderFoco(e: React.FocusEvent<HTMLDivElement>) {
    if (!editando) return;
    if (e.relatedTarget && e.currentTarget.contains(e.relatedTarget as Node)) return;
    salvar();
  }

  return (
    <div style={{ marginTop: 8 }} onBlur={aoPerderFoco}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
        {!editando ? (
          <button onClick={() => setEditando(true)}>Editar</button>
        ) : (
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={salvar} disabled={salvando}>
              {salvando ? "Salvando..." : "Salvar e fechar"}
            </button>
          </div>
        )}
      </div>

      {erro && <p style={{ color: "#B0655C" }}>{erro}</p>}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          marginTop: 8,
        }}
      >
        {CAMPOS.map((c) => (
          <div key={c.chave} style={c.span ? { gridColumn: "1 / -1" } : undefined}>
            <div style={{ fontSize: 10.5, textTransform: "uppercase", color: "#7D7979", letterSpacing: 0.5 }}>
              {c.label}
            </div>
            <div style={{ marginTop: 2 }}>{campoValor(c.chave, c.tipo)}</div>
          </div>
        ))}

        <div>
          <div style={{ fontSize: 10.5, textTransform: "uppercase", color: "#7D7979", letterSpacing: 0.5 }}>
            Publicação D.O.U
          </div>
          <div style={{ marginTop: 2 }}>
            {!editando ? (
              processo.publicacao_dou ? (
                <span style={{ display: "inline-flex", alignItems: "flex-start", gap: 6 }}>
                  {processo.publicacao_dou}
                  <BotaoCopiar texto={processo.publicacao_dou} />
                </span>
              ) : (
                "não informado"
              )
            ) : (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <input
                  placeholder="Edição nº"
                  value={dou.edicao}
                  onChange={(e) => atualizarDou("edicao", e.target.value)}
                  style={{ padding: 6, width: 90 }}
                />
                <input
                  placeholder="Página"
                  value={dou.pagina}
                  onChange={(e) => atualizarDou("pagina", e.target.value)}
                  style={{ padding: 6, width: 80 }}
                />
                <input
                  type="date"
                  value={dou.data}
                  onChange={(e) => atualizarDou("data", e.target.value)}
                  style={{ padding: 6, flex: 1, minWidth: 140 }}
                />
              </div>
            )}
          </div>
        </div>

        <div style={{ gridColumn: "1 / -1" }}>
          <div style={{ fontSize: 10.5, textTransform: "uppercase", color: "#7D7979", letterSpacing: 0.5 }}>
            Portaria Designação de Fiscal
          </div>
          <div style={{ marginTop: 2 }}>
            {!editando ? (
              processo.portaria_designacao_fiscal ? (
                <span style={{ display: "inline-flex", alignItems: "flex-start", gap: 6 }}>
                  {processo.portaria_designacao_fiscal}
                  <BotaoCopiar texto={processo.portaria_designacao_fiscal} />
                </span>
              ) : (
                "não informado"
              )
            ) : (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <input
                  placeholder="Portaria CGLIS nº"
                  value={portaria.numero}
                  onChange={(e) => atualizarPortaria("numero", e.target.value)}
                  style={{ padding: 6, width: 110 }}
                />
                <input
                  type="date"
                  value={portaria.data}
                  onChange={(e) => atualizarPortaria("data", e.target.value)}
                  style={{ padding: 6, width: 150 }}
                />
                <select
                  value={portaria.tipo}
                  onChange={(e) => atualizarPortaria("tipo", e.target.value)}
                  style={{ padding: 6 }}
                >
                  <option value="BGP">BGP</option>
                  <option value="BSE">BSE</option>
                </select>
                <input
                  placeholder={`Nº ${portaria.tipo}`}
                  value={portaria.numeroTipo}
                  onChange={(e) => atualizarPortaria("numeroTipo", e.target.value)}
                  style={{ padding: 6, width: 110 }}
                />
                <input
                  type="date"
                  value={portaria.dataTipo}
                  onChange={(e) => atualizarPortaria("dataTipo", e.target.value)}
                  style={{ padding: 6, width: 150 }}
                />
              </div>
            )}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 10.5, textTransform: "uppercase", color: "#7D7979", letterSpacing: 0.5 }}>
            Vigência do Contrato
          </div>
          <div style={{ marginTop: 2 }}>
            {!editando ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                {`${formatarData(processo.vigencia_inicio)} a ${formatarData(processo.vigencia_fim)}`}
                {(processo.vigencia_inicio || processo.vigencia_fim) && (
                  <BotaoCopiar texto={`${formatarData(processo.vigencia_inicio)} a ${formatarData(processo.vigencia_fim)}`} />
                )}
              </span>
            ) : (
              <div style={{ display: "flex", gap: 6 }}>
                <input
                  type="date"
                  value={valores.vigencia_inicio}
                  onChange={(e) => atualizar("vigencia_inicio", e.target.value)}
                  style={{ padding: 6, flex: 1 }}
                />
                <input
                  type="date"
                  value={valores.vigencia_fim}
                  onChange={(e) => atualizar("vigencia_fim", e.target.value)}
                  style={{ padding: 6, flex: 1 }}
                />
              </div>
            )}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 10.5, textTransform: "uppercase", color: "#7D7979", letterSpacing: 0.5 }}>
            Empresa
          </div>
          <div style={{ marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
            {processo.fornecedores?.nome ?? "não informado"}
            {processo.fornecedores?.nome && <BotaoCopiar texto={processo.fornecedores.nome} />}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 10.5, textTransform: "uppercase", color: "#7D7979", letterSpacing: 0.5 }}>
            CNPJ
          </div>
          <div style={{ marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
            {processo.fornecedores?.cnpj ?? "não informado"}
            {processo.fornecedores?.cnpj && <BotaoCopiar texto={processo.fornecedores.cnpj} />}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 10.5, textTransform: "uppercase", color: "#7D7979", letterSpacing: 0.5 }}>
            Valor Global do Contrato
          </div>
          <div style={{ marginTop: 2 }}>
            {editando ? (
              <CampoMascarado
                valor={valores.valor_global}
                formatar={formatarMoedaBR}
                onChange={(v) => atualizar("valor_global", v)}
                style={{ width: "100%", padding: 6 }}
              />
            ) : (
              <>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  {formatarMoeda(processo.valor_global) ?? "não informado"}
                  {formatarMoeda(processo.valor_global) && <BotaoCopiar texto={formatarMoeda(processo.valor_global)!} />}
                </span>
                {extensoMoeda(processo.valor_global) && (
                  <div style={{ fontSize: 11, color: "#7D7979" }}>{extensoMoeda(processo.valor_global)}</div>
                )}
              </>
            )}
          </div>
        </div>

        <div style={{ gridColumn: "1 / -1" }}>
          <div style={{ fontSize: 10.5, textTransform: "uppercase", color: "#7D7979", letterSpacing: 0.5 }}>
            Valor da Garantia
          </div>
          <div style={{ marginTop: 2 }}>
            {editando ? (
              <CampoMascarado
                valor={valores.valor_garantia}
                formatar={formatarMoedaBR}
                onChange={(v) => atualizar("valor_garantia", v)}
                style={{ width: "100%", padding: 6 }}
              />
            ) : (
              <>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  {formatarMoeda(processo.valor_garantia) ?? "não informado"}
                  {formatarMoeda(processo.valor_garantia) && <BotaoCopiar texto={formatarMoeda(processo.valor_garantia)!} />}
                </span>
                {extensoMoeda(processo.valor_garantia) && (
                  <div style={{ fontSize: 11, color: "#7D7979" }}>{extensoMoeda(processo.valor_garantia)}</div>
                )}
              </>
            )}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 10.5, textTransform: "uppercase", color: "#7D7979", letterSpacing: 0.5 }}>
            Gestor Titular
          </div>
          <div style={{ marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
            {formatarPessoa(processo.gestor)}
            {processo.gestor && <BotaoCopiar texto={formatarPessoa(processo.gestor)} />}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10.5, textTransform: "uppercase", color: "#7D7979", letterSpacing: 0.5 }}>
            Gestor Substituto
          </div>
          <div style={{ marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
            {formatarPessoa(processo.gestor_substituto)}
            {processo.gestor_substituto && <BotaoCopiar texto={formatarPessoa(processo.gestor_substituto)} />}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10.5, textTransform: "uppercase", color: "#7D7979", letterSpacing: 0.5 }}>
            Fiscal Titular
          </div>
          <div style={{ marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
            {formatarPessoa(processo.fiscal)}
            {processo.fiscal && <BotaoCopiar texto={formatarPessoa(processo.fiscal)} />}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10.5, textTransform: "uppercase", color: "#7D7979", letterSpacing: 0.5 }}>
            Fiscal Substituto
          </div>
          <div style={{ marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
            {formatarPessoa(processo.fiscal_substituto)}
            {processo.fiscal_substituto && <BotaoCopiar texto={formatarPessoa(processo.fiscal_substituto)} />}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <div style={{ fontSize: 10.5, textTransform: "uppercase", color: "#7D7979", letterSpacing: 0.5, marginBottom: 6 }}>
          Itens do contrato
        </div>
        {itens.length === 0 ? (
          <p style={{ fontSize: 12.5, color: "#7D7979", margin: 0 }}>Nenhum item cadastrado.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[...itens]
              .sort((a, b) => a.numero - b.numero)
              .map((item) => (
                <div
                  key={item.id}
                  style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap", fontSize: 12.5 }}
                >
                  <span style={{ fontWeight: 600 }}>Item {item.numero}</span>
                  <span>{item.descricao}</span>
                  {item.catmat && <span style={{ color: "#7D7979" }}>CATMAT {item.catmat}</span>}
                  {item.quantidade != null && (
                    <span style={{ color: "#7D7979" }}>
                      {item.quantidade.toLocaleString("pt-BR")} {item.unidade_medida ?? ""}
                    </span>
                  )}
                  {item.valor_unitario != null && (
                    <span style={{ color: "#7D7979" }}>{formatarMoeda(item.valor_unitario)}</span>
                  )}
                </div>
              ))}
          </div>
        )}
        <p style={{ fontSize: 11, color: "#7D7979", marginTop: 6 }}>
          Itens são só leitura aqui — cadastre/edite na seção "Cronograma de entregas" do contrato.
        </p>
      </div>

      <p style={{ fontSize: 11, color: "#7D7979", marginTop: 8 }}>
        Gestor/Fiscal são só leitura aqui — edite na seção "Gestão e Fiscalização" do contrato.
      </p>
    </div>
  );
}
