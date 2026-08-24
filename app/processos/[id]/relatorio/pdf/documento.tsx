"use client";

import { useState } from "react";
import { valorPorExtenso } from "@/lib/extenso";

type Pessoa = { nome: string; matricula: string | null } | null;

type Processo = {
  numero_contrato: string;
  nup_principal: string | null;
  objeto: string;
  quantidade_contratada: string | null;
  data_assinatura: string | null;
  vigencia_inicio: string | null;
  vigencia_fim: string | null;
  processo_eletronico_numero: string | null;
  pregao_eletronico_numero: string | null;
  ata_registro_precos_numero: string | null;
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
  conclusao_tipo: "Regular" | "Irregular" | null;
  conclusao_checks: string[] | null;
  conclusao_texto: string | null;
  conclusao_penalidade: string | null;
  fornecedores: { nome: string; cnpj: string } | null;
  coordenacoes: { nome: string; sigla: string } | null;
  gestor: Pessoa;
  gestor_substituto: Pessoa;
  fiscal: Pessoa;
  fiscal_substituto: Pessoa;
};

type Execucao = {
  id: string;
  numero: number;
  quantidade: number;
  unidade: string | null;
  data_prevista: string | null;
};

type PautaItem = { id: string; uf: string; quantidade: number };

type Entrega = {
  id: string;
  local_entrega: string | null;
  quantidade: number | null;
  valor_total_nf: number | null;
  danfe_venda: string | null;
  danfe_remessa: string | null;
  lote: string | null;
  data_fabricacao: string | null;
  data_validade: string | null;
  data_entrega: string | null;
  responsavel: string | null;
  atraso_dias: number | null;
  percentual_transcurso: number | null;
};

type Andamento = { id: string; texto: string };

function formatarData(data: string | null) {
  return data ? new Date(`${data}T00:00:00`).toLocaleDateString("pt-BR") : "não informado";
}

function formatarMoeda(valor: number | null) {
  return valor != null ? valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : null;
}

function formatarPessoa(p: Pessoa) {
  if (!p) return "não informado";
  return p.matricula ? `${p.nome} — matrícula SIAPE ${p.matricula}` : p.nome;
}

async function copiar(texto: string) {
  try {
    await navigator.clipboard.writeText(texto);
  } catch {
    // sem permissão de clipboard — ignora silenciosamente
  }
}

function BotaoCopiar({ texto }: { texto: string }) {
  return (
    <span
      className="no-print"
      onClick={() => copiar(texto)}
      style={{
        marginLeft: "auto",
        cursor: "pointer",
        fontSize: 10,
        fontWeight: 600,
        color: "#7D5411",
        background: "rgba(182,130,53,.07)",
        borderRadius: 7,
        padding: "4px 9px",
      }}
    >
      copiar
    </span>
  );
}

const SEC7 = [
  "A conferência e o “atesto” realizados nas notas fiscais/Declarações de Importação recebidas nesta Coordenação tem o objetivo de verificar se as informações constantes nestes documentos fiscais estão de acordo com o exigido em Contrato, em termos de quantitativo, valor, local de entrega, data de recebimento do medicamento e outros dados que possam ser atribuídos ao Contrato. Ou seja, é feita apenas uma análise documental/administrativa e não o recebimento in loco de qualquer medicamento. Dessa forma, a conferência e o atesto realizados nesta Coordenação não podem configurar como recebimento definitivo;",
  "As demais ações exigidas para o servidor que foi designado para o acompanhamento do Contrato, de acordo com a Portaria GM/MS nº 78 de 16 de janeiro de 2006, não são possíveis de serem atendidas na íntegra, em razão de algumas das observações já feitas anteriormente, no Documento datado de 05 de setembro de 2007, sob o registro SIPAR nº. 25000-161167/2007-51.",
  "A despeito do documento citado no item anterior, cabe ressaltar o exposto na Nota Técnica nº 601/2015/DAF/SCTIE, encaminhada através do Memorando nº 3708/2015/DAF/SCTIE, datado de 15 de dezembro de 2015, em resposta ao Memorando nº 284/2015/DLOG/SE/MS, o qual trata sobre o atesto, pelos fiscais de Contrato, nas notas fiscais encaminhadas para pagamento.",
  "A quantidade de Contratos para fiscalização foi distribuída de forma desproporcional em relação à quantidade de servidores lotados no Departamento de Assistência Farmacêutica, razão pela qual a fiscalização não pôde ser realizada, em sua totalidade, nos termos da Lei nº 14.133/2021 e da Portaria nº 78/2006, considerando, principalmente, que as entregas são efetuadas de forma descentralizada nas 27 unidades federadas e no Almoxarifado do Ministério da Saúde em Guarulhos-SP.",
  "Nas entregas realizadas no Almoxarifado do Ministério da Saúde em Guarulhos-SP e nos almoxarifados das Secretarias Estaduais de Saúde, não houve acompanhamento in loco pelo servidor designado para a fiscalização do Contrato; a conferência do medicamento no momento da entrega ficou a cargo das respectivas Comissões de Recebimento.",
  "O acompanhamento e a efetivação dos pagamentos das parcelas entregues do medicamento foram realizados pela Coordenação-Geral de Execução Orçamentária e Financeira - CGORF, sendo gerenciadas pelo Gestor Financeiro dos Contratos designado para essa função, lotado na respectiva Coordenação.",
];

export default function Documento({
  processo: p,
  execucoes,
  pauta,
  entregas,
  andamentos,
}: {
  processo: Processo;
  execucoes: Execucao[];
  pauta: PautaItem[];
  entregas: Entrega[];
  andamentos: Andamento[];
}) {
  const [relTipo, setRelTipo] = useState<"Parcial" | "Final">("Parcial");
  const [inc7, setInc7] = useState(true);

  const cn = p.numero_contrato;

  const [textoLocal, setTextoLocal] = useState(
    `Conforme preconizado no subitem 5.5 do Termo de Referência, anexo ao Edital ([SEI]), a Contratada deveria agendar a entrega de cada parcela nos locais indicados na relação de endereços constantes do Apêndice II do referido Termo.`,
  );
  const [textoPauta, setTextoPauta] = useState(
    `A ${p.coordenacoes?.nome ?? "[coordenação]"} - ${p.coordenacoes?.sigla ?? "[sigla]"} encaminhou a Pauta de Distribuição nº [Nº] ([SEI]), em [data], para o atendimento da programação do [trimestre], conforme a seguir:`,
  );
  const [textoReferencia, setTextoReferencia] = useState(
    `Referência: Processo nº ${p.nup_principal ?? "[NUP]"}    SEI nº [SEI]`,
  );

  const cronTotal = execucoes.reduce((s, e) => s + Number(e.quantidade), 0);
  const pautaTotal = pauta.reduce((s, i) => s + Number(i.quantidade), 0);
  const entTotalQ = entregas.reduce((s, e) => s + (e.quantidade ?? 0), 0);
  const entTotalV = entregas.reduce((s, e) => s + (e.valor_total_nf ?? 0), 0);

  const quadro: { k: string; v: string }[] = [
    { k: "Processo Eletrônico nº", v: p.processo_eletronico_numero ?? "não informado" },
    { k: "Pregão Eletrônico nº", v: p.pregao_eletronico_numero ?? "não informado" },
    { k: "Ata de Registro de Preços nº", v: p.ata_registro_precos_numero ?? "não informado" },
    { k: "Contrato nº", v: p.numero_contrato },
    { k: "Objeto", v: p.objeto },
    { k: "Quantidade Contratada", v: p.quantidade_contratada ?? "não informado" },
    { k: "Data da Assinatura", v: formatarData(p.data_assinatura) },
    { k: "Vigência do Contrato", v: `${formatarData(p.vigencia_inicio)} a ${formatarData(p.vigencia_fim)}` },
    { k: "Empresa", v: p.fornecedores?.nome ?? "não informado" },
    { k: "CNPJ", v: p.fornecedores?.cnpj ?? "não informado" },
    {
      k: "Valor Unitário",
      v: formatarMoeda(p.valor_unitario)
        ? `${formatarMoeda(p.valor_unitario)} (${valorPorExtenso(p.valor_unitario as number)})`
        : "não informado",
    },
    {
      k: "Valor Global do Contrato",
      v: formatarMoeda(p.valor_global)
        ? `${formatarMoeda(p.valor_global)} (${valorPorExtenso(p.valor_global as number)})`
        : "não informado",
    },
    {
      k: "Valor da Garantia",
      v: formatarMoeda(p.valor_garantia)
        ? `${formatarMoeda(p.valor_garantia)} (${valorPorExtenso(p.valor_garantia as number)})`
        : "não informado",
    },
    { k: "Publicação D.O.U", v: p.publicacao_dou ?? "não informado" },
    { k: "Publicação PNCP", v: p.publicacao_pncp ?? "não informado" },
    { k: "Portaria Designação de Fiscal", v: p.portaria_designacao_fiscal ?? "não informado" },
    { k: "Nota de Empenho nº", v: p.nota_empenho_numero ?? "não informado" },
    { k: "Programa de Trabalho", v: p.programa_trabalho ?? "não informado" },
    { k: "Natureza de Despesa", v: p.natureza_despesa ?? "não informado" },
    { k: "Local de Entrega", v: p.local_entrega ?? "não informado" },
    { k: "Gestor Titular", v: formatarPessoa(p.gestor) },
    { k: "Gestor Substituto", v: formatarPessoa(p.gestor_substituto) },
    { k: "Fiscal Titular", v: formatarPessoa(p.fiscal) },
    { k: "Fiscal Substituto", v: formatarPessoa(p.fiscal_substituto) },
  ];

  const quadroTexto = quadro.map((q) => `${q.k}: ${q.v}`).join("\n");
  const cronTexto =
    "Parcela\tQuantitativo\tPrazo máximo de entrega (até)\n" +
    execucoes.map((e) => `${e.numero}\t${e.quantidade} ${e.unidade ?? ""}\t${formatarData(e.data_prevista)}`).join("\n") +
    `\nTOTAL\t${cronTotal}\t------------`;
  const execTexto =
    (pauta.length > 0
      ? textoPauta +
        "\n\nUF\tQuantidade\n" +
        pauta.map((i) => `${i.uf}\t${i.quantidade}`).join("\n") +
        `\nTotal\t${pautaTotal}\n\n`
      : "") +
    "Dados da entrega\n" +
    entregas
      .map(
        (e) =>
          `${e.local_entrega ?? "—"} · ${e.quantidade ?? "—"} · ${formatarMoeda(e.valor_total_nf) ?? "—"} · lote ${e.lote ?? "—"} · entrega ${formatarData(e.data_entrega)}`,
      )
      .join("\n") +
    `\nTOTAL\t${entTotalQ}\t${formatarMoeda(entTotalV) ?? "—"}`;
  const ocorrTexto = andamentos.map((a) => a.texto).join("\n\n");
  const conclTexto =
    (p.conclusao_checks ?? []).map((c) => `- ${c}`).join("\n") +
    (p.conclusao_texto ? `\n\n${p.conclusao_texto}` : "") +
    (p.conclusao_penalidade ? `\n\nSugestão de penalidade: ${p.conclusao_penalidade}` : "");

  const nomeFiscal = (p.fiscal?.nome ?? "").toUpperCase();

  return (
    <div>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: #fff; }
        }
        @page { margin: 2cm; }
      `}</style>

      <div
        className="no-print"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap",
          background: "#fff",
          borderRadius: 8,
          padding: "12px 15px",
          border: "1px solid #eee",
          marginBottom: 16,
        }}
      >
        <span style={{ fontSize: 11, color: "#7D7979" }}>Tipo</span>
        <div style={{ display: "flex", gap: 6 }}>
          {(["Parcial", "Final"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setRelTipo(t)}
              style={{ fontWeight: relTipo === t ? 700 : 400 }}
            >
              {t}
            </button>
          ))}
        </div>
        <span style={{ width: 1, height: 22, background: "#ddd" }} />
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
          <input type="checkbox" checked={inc7} onChange={(e) => setInc7(e.target.checked)} />
          Seção 7 (texto padrão)
        </label>
        <button type="button" onClick={() => window.print()} style={{ marginLeft: "auto" }}>
          Exportar PDF
        </button>
      </div>

      {!inc7 && (
        <p
          className="no-print"
          style={{
            background: "#FBF3D3",
            borderRadius: 8,
            padding: "10px 12px",
            fontSize: 12,
            fontWeight: 600,
            color: "#7A6320",
          }}
        >
          Seção 7 (Considerações sobre a Fiscalização de Contratos) não incluída — cole manualmente após
          exportar.
        </p>
      )}

      <div
        style={{
          background: "#fff",
          borderRadius: 8,
          padding: "54px 60px",
          fontFamily: "'Times New Roman', Times, serif",
          color: "#000",
          lineHeight: 1.58,
          boxShadow: "0 1px 2px rgba(0,0,0,.08)",
        }}
      >
        <div style={{ textAlign: "center", fontSize: 13, lineHeight: 1.55 }}>
          <div>Ministério da Saúde</div>
          <div>Secretaria de Ciência, Tecnologia e Inovação em Saúde</div>
          <div>Departamento de Assistência Farmacêutica e Insumos Estratégicos</div>
          <div>Coordenação de Fiscalização de Contratos e Instrumentos Congêneres da Assistência Farmacêutica</div>
        </div>

        <div style={{ textAlign: "center", fontSize: 14, fontWeight: 600, margin: "30px 0 24px" }}>
          RELATÓRIO {relTipo === "Final" ? "FINAL DE EXECUÇÃO" : "PARCIAL"} DO CONTRATO ADMINISTRATIVO Nº {cn}
        </div>

        <p style={{ margin: "0 0 20px", fontSize: 13, textAlign: "justify" }}>
          O presente relatório refere-se ao Contrato nº {cn}, celebrado entre o Ministério da Saúde - MS e a
          empresa {p.fornecedores?.nome ?? "não informada"}, para aquisição do medicamento {p.objeto}, decorrente
          da Ata de Registro de Preços nº {p.ata_registro_precos_numero ?? "[Nº]"} do Pregão Eletrônico nº{" "}
          {p.pregao_eletronico_numero ?? "[Nº]"}, em observância às disposições da Lei nº 14.133, de 1º de abril
          de 2021, e demais legislação aplicável. Informa-se o que se segue quanto à execução do referido
          instrumento legal:
        </p>

        <div style={{ display: "flex", alignItems: "baseline", gap: 8, margin: "0 0 10px" }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>1. QUADRO RESUMITIVO</span>
          <BotaoCopiar texto={quadroTexto} />
        </div>
        <div style={{ borderTop: "1px solid #000", marginBottom: 20 }}>
          {quadro.map((q) => (
            <div
              key={q.k}
              style={{
                display: "grid",
                gridTemplateColumns: "230px 1fr",
                gap: 12,
                padding: "5px 6px",
                fontSize: 12,
                borderBottom: "1px solid #000",
              }}
            >
              <span style={{ fontWeight: 600 }}>{q.k}</span>
              <span>{q.v}</span>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>2. LOCAL DE ENTREGA</div>
        <textarea
          className="doc-textarea"
          value={textoLocal}
          onChange={(e) => setTextoLocal(e.target.value)}
          style={{
            width: "100%",
            margin: "0 0 20px",
            fontSize: 13,
            fontFamily: "inherit",
            textAlign: "justify",
            border: "none",
            outline: "none",
            resize: "vertical",
            minHeight: 48,
          }}
        />

        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>3. CRONOGRAMA DE ENTREGA</span>
          <BotaoCopiar texto={cronTexto} />
        </div>
        <div style={{ border: "1px solid #000", marginBottom: 20, fontSize: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", fontWeight: 600, borderBottom: "1px solid #000" }}>
            <div style={{ padding: "5px 7px", borderRight: "1px solid #000" }}>PARCELA</div>
            <div style={{ padding: "5px 7px", borderRight: "1px solid #000" }}>QUANTITATIVO</div>
            <div style={{ padding: "5px 7px" }}>PRAZO MÁXIMO DE ENTREGA (Até)</div>
          </div>
          {execucoes.map((e) => (
            <div key={e.id} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: "1px solid #000" }}>
              <div style={{ padding: "5px 7px", borderRight: "1px solid #000" }}>{e.numero}</div>
              <div style={{ padding: "5px 7px", borderRight: "1px solid #000" }}>
                {e.quantidade} {e.unidade ?? ""}
              </div>
              <div style={{ padding: "5px 7px" }}>{formatarData(e.data_prevista)}</div>
            </div>
          ))}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", fontWeight: 600 }}>
            <div style={{ padding: "5px 7px", borderRight: "1px solid #000" }}>TOTAL</div>
            <div style={{ padding: "5px 7px", borderRight: "1px solid #000" }}>{cronTotal}</div>
            <div style={{ padding: "5px 7px" }}>------------</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>4. EXECUÇÃO DO CONTRATO</span>
          <BotaoCopiar texto={execTexto} />
        </div>
        {pauta.length > 0 && (
          <>
            <textarea
              value={textoPauta}
              onChange={(e) => setTextoPauta(e.target.value)}
              style={{
                width: "100%",
                margin: "0 0 10px",
                fontSize: 13,
                fontFamily: "inherit",
                textAlign: "justify",
                border: "none",
                outline: "none",
                resize: "vertical",
                minHeight: 48,
              }}
            />
            <div style={{ border: "1px solid #000", marginBottom: 16, fontSize: 12, maxWidth: 340 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 110px", fontWeight: 600, borderBottom: "1px solid #000" }}>
                <div style={{ padding: "5px 7px", borderRight: "1px solid #000" }}>UF</div>
                <div style={{ padding: "5px 7px" }}>Quantidade</div>
              </div>
              {pauta.map((i) => (
                <div key={i.id} style={{ display: "grid", gridTemplateColumns: "1fr 110px", borderBottom: "1px solid #000" }}>
                  <div style={{ padding: "5px 7px", borderRight: "1px solid #000" }}>{i.uf}</div>
                  <div style={{ padding: "5px 7px" }}>{i.quantidade}</div>
                </div>
              ))}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 110px", fontWeight: 600 }}>
                <div style={{ padding: "5px 7px", borderRight: "1px solid #000" }}>Total</div>
                <div style={{ padding: "5px 7px" }}>{pautaTotal}</div>
              </div>
            </div>
          </>
        )}

        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Dados da entrega</div>
        <div style={{ border: "1px solid #000", marginBottom: 20, fontSize: 10.5, overflowX: "auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(12,1fr)", fontWeight: 600, borderBottom: "1px solid #000", minWidth: 940 }}>
            {["Local", "Qtd.", "Valor NF", "DANFE venda", "DANFE remessa", "Lote", "Fabricação", "Validade", "Entrega", "Responsável", "Atraso (d.)", "% transc."].map(
              (h) => (
                <div key={h} style={{ padding: "4px 5px", lineHeight: 1.2 }}>
                  {h}
                </div>
              ),
            )}
          </div>
          {entregas.map((e) => (
            <div key={e.id} style={{ display: "grid", gridTemplateColumns: "repeat(12,1fr)", borderBottom: "1px solid #000", minWidth: 940 }}>
              {[
                e.local_entrega ?? "—",
                e.quantidade ?? "—",
                formatarMoeda(e.valor_total_nf) ?? "—",
                e.danfe_venda ?? "—",
                e.danfe_remessa ?? "—",
                e.lote ?? "—",
                formatarData(e.data_fabricacao),
                formatarData(e.data_validade),
                formatarData(e.data_entrega),
                e.responsavel ?? "—",
                e.atraso_dias ?? "—",
                e.percentual_transcurso ?? "—",
              ].map((cl, i) => (
                <div key={i} style={{ padding: "4px 5px", lineHeight: 1.25 }}>
                  {cl}
                </div>
              ))}
            </div>
          ))}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(12,1fr)", fontWeight: 600, minWidth: 940 }}>
            <div style={{ padding: "4px 5px" }}>TOTAL</div>
            <div style={{ padding: "4px 5px" }}>{entTotalQ}</div>
            <div style={{ padding: "4px 5px" }}>{formatarMoeda(entTotalV) ?? "—"}</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>5. OCORRÊNCIAS</span>
          <BotaoCopiar texto={ocorrTexto} />
        </div>
        {andamentos.length > 0 ? (
          andamentos.map((a) => (
            <p key={a.id} style={{ margin: "0 0 12px", fontSize: 13, textAlign: "justify" }}>
              {a.texto}
            </p>
          ))
        ) : (
          <p style={{ margin: "0 0 12px", fontSize: 13, color: "#666" }}>
            Nenhum andamento marcado para inclusão.
          </p>
        )}

        <div style={{ fontSize: 13, fontWeight: 600, margin: "20px 0 8px" }}>6. PAGAMENTOS ENCAMINHADOS</div>
        <p style={{ margin: "0 0 20px", fontSize: 13, color: "#666" }}>
          [Espaço reservado — módulo de pagamentos ainda não construído.]
        </p>

        {inc7 && (
          <>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
              7. CONSIDERAÇÕES SOBRE A FISCALIZAÇÃO DE CONTRATOS
            </div>
            {SEC7.map((t, i) => (
              <p key={i} style={{ margin: "0 0 12px", fontSize: 13, textAlign: "justify" }}>
                {t}
              </p>
            ))}
          </>
        )}

        <div style={{ display: "flex", alignItems: "baseline", gap: 8, margin: "20px 0 8px" }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>8. CONCLUSÕES</span>
          <BotaoCopiar texto={conclTexto} />
        </div>
        {p.conclusao_tipo ? (
          <>
            <p style={{ margin: "0 0 8px", fontSize: 13 }}>Diante do exposto, considerando:</p>
            {(p.conclusao_checks ?? []).map((c, i) => (
              <p key={i} style={{ margin: "0 0 4px 22px", fontSize: 13, textAlign: "justify" }}>
                {c};
              </p>
            ))}
            <p style={{ margin: "14px 0 0", fontSize: 13, textAlign: "justify" }}>{p.conclusao_texto}</p>
            <p style={{ margin: "14px 0 0", fontSize: 13, textAlign: "justify" }}>
              É importante ressaltar que a responsabilidade da empresa fornecedora extrapola a simples execução
              do objeto contratado. Mesmo depois de encerrado o prazo de vigência e cumpridas as obrigações
              estipuladas em Contrato, a Contratada responde por qualquer desconformidade na qualidade dos
              produtos fornecidos e pelos compromissos assumidos ao longo do Contrato.
            </p>
            {p.conclusao_penalidade && (
              <p style={{ margin: "8px 0 0", fontSize: 13 }}>
                <strong>Sugestão de penalidade:</strong> {p.conclusao_penalidade}
              </p>
            )}
          </>
        ) : (
          <p style={{ fontSize: 13, color: "#666" }}>Conclusões ainda não definidas.</p>
        )}

        <div style={{ textAlign: "center", margin: "34px 0 0", fontSize: 13 }}>
          <div style={{ fontWeight: 600 }}>{nomeFiscal || "(fiscal não definido)"}</div>
          <div>Fiscal Contratual</div>
        </div>
        <div style={{ marginTop: 30, paddingTop: 10, borderTop: "1px solid #000", fontSize: 10.5, lineHeight: 1.58, color: "#333" }}>
          <input
            value={textoReferencia}
            onChange={(e) => setTextoReferencia(e.target.value)}
            style={{ width: "100%", border: "none", outline: "none", fontFamily: "inherit", fontSize: "inherit", color: "inherit", background: "transparent" }}
          />
          <div>Coordenação de Fiscalização de Contratos e Instrumentos Congêneres da Assistência Farmacêutica - COFISC</div>
          <div>Esplanada dos Ministérios, Bloco G - Bairro Zona Cívico-Administrativa, Brasília/DF, CEP 70058-900</div>
          <div>Site - saude.gov.br</div>
        </div>
      </div>
    </div>
  );
}
