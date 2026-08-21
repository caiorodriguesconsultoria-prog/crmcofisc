"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { valorPorExtenso } from "@/lib/extenso";

type Pessoa = { nome: string; matricula: string | null } | null;

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
  { chave: "ata_registro_precos_numero", label: "Ata de Registro de Preços nº" },
  { chave: "numero_contrato", label: "Contrato nº" },
  { chave: "objeto", label: "Objeto", span: true, tipo: "textarea" },
  { chave: "quantidade_contratada", label: "Quantidade Contratada" },
  { chave: "data_assinatura", label: "Data da Assinatura", tipo: "data" },
  { chave: "publicacao_dou", label: "Publicação D.O.U" },
  { chave: "publicacao_pncp", label: "Publicação PNCP" },
  { chave: "portaria_designacao_fiscal", label: "Portaria Designação de Fiscal", span: true },
  { chave: "nota_empenho_numero", label: "Nota de Empenho nº" },
  { chave: "programa_trabalho", label: "Programa de Trabalho" },
  { chave: "natureza_despesa", label: "Natureza de Despesa" },
  { chave: "local_entrega", label: "Local de Entrega" },
];

export default function QuadroResumitivo({
  processoId,
  processo,
}: {
  processoId: string;
  processo: Processo;
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
    iniciais.valor_unitario = processo.valor_unitario?.toString() ?? "";
    iniciais.valor_global = processo.valor_global?.toString() ?? "";
    iniciais.valor_garantia = processo.valor_garantia?.toString() ?? "";
    return iniciais;
  });

  function atualizar(chave: string, valor: string) {
    setValores((atual) => ({ ...atual, [chave]: valor }));
  }

  async function salvar() {
    setErro(null);
    setSalvando(true);
    const { error } = await supabase
      .from("processos")
      .update({
        processo_eletronico_numero: valores.processo_eletronico_numero || null,
        pregao_eletronico_numero: valores.pregao_eletronico_numero || null,
        ata_registro_precos_numero: valores.ata_registro_precos_numero || null,
        numero_contrato: valores.numero_contrato,
        objeto: valores.objeto,
        quantidade_contratada: valores.quantidade_contratada || null,
        data_assinatura: valores.data_assinatura || null,
        vigencia_inicio: valores.vigencia_inicio || null,
        vigencia_fim: valores.vigencia_fim || null,
        publicacao_dou: valores.publicacao_dou || null,
        publicacao_pncp: valores.publicacao_pncp || null,
        valor_unitario: valores.valor_unitario ? Number(valores.valor_unitario) : null,
        valor_global: valores.valor_global ? Number(valores.valor_global) : null,
        valor_garantia: valores.valor_garantia ? Number(valores.valor_garantia) : null,
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
      if (tipo === "data") return formatarData(valorAtual);
      return valorAtual || "não informado";
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

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <strong>Quadro resumitivo</strong>
        {!editando ? (
          <button onClick={() => setEditando(true)}>Editar</button>
        ) : (
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={salvar} disabled={salvando}>
              Salvar
            </button>
            <button onClick={() => setEditando(false)} disabled={salvando}>
              Cancelar
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
            Vigência do Contrato
          </div>
          <div style={{ marginTop: 2 }}>
            {!editando ? (
              `${formatarData(processo.vigencia_inicio)} a ${formatarData(processo.vigencia_fim)}`
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
          <div style={{ marginTop: 2 }}>{processo.fornecedores?.nome ?? "não informado"}</div>
        </div>

        <div>
          <div style={{ fontSize: 10.5, textTransform: "uppercase", color: "#7D7979", letterSpacing: 0.5 }}>
            CNPJ
          </div>
          <div style={{ marginTop: 2 }}>{processo.fornecedores?.cnpj ?? "não informado"}</div>
        </div>

        <div>
          <div style={{ fontSize: 10.5, textTransform: "uppercase", color: "#7D7979", letterSpacing: 0.5 }}>
            Valor Unitário
          </div>
          <div style={{ marginTop: 2 }}>
            {editando ? (
              <input
                type="number"
                step="0.01"
                value={valores.valor_unitario}
                onChange={(e) => atualizar("valor_unitario", e.target.value)}
                style={{ width: "100%", padding: 6 }}
              />
            ) : (
              <>
                {formatarMoeda(processo.valor_unitario) ?? "não informado"}
                {extensoMoeda(processo.valor_unitario) && (
                  <div style={{ fontSize: 11, color: "#7D7979" }}>{extensoMoeda(processo.valor_unitario)}</div>
                )}
              </>
            )}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 10.5, textTransform: "uppercase", color: "#7D7979", letterSpacing: 0.5 }}>
            Valor Global do Contrato
          </div>
          <div style={{ marginTop: 2 }}>
            {editando ? (
              <input
                type="number"
                step="0.01"
                value={valores.valor_global}
                onChange={(e) => atualizar("valor_global", e.target.value)}
                style={{ width: "100%", padding: 6 }}
              />
            ) : (
              <>
                {formatarMoeda(processo.valor_global) ?? "não informado"}
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
              <input
                type="number"
                step="0.01"
                value={valores.valor_garantia}
                onChange={(e) => atualizar("valor_garantia", e.target.value)}
                style={{ width: "100%", padding: 6 }}
              />
            ) : (
              <>
                {formatarMoeda(processo.valor_garantia) ?? "não informado"}
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
          <div style={{ marginTop: 2 }}>{formatarPessoa(processo.gestor)}</div>
        </div>
        <div>
          <div style={{ fontSize: 10.5, textTransform: "uppercase", color: "#7D7979", letterSpacing: 0.5 }}>
            Gestor Substituto
          </div>
          <div style={{ marginTop: 2 }}>{formatarPessoa(processo.gestor_substituto)}</div>
        </div>
        <div>
          <div style={{ fontSize: 10.5, textTransform: "uppercase", color: "#7D7979", letterSpacing: 0.5 }}>
            Fiscal Titular
          </div>
          <div style={{ marginTop: 2 }}>{formatarPessoa(processo.fiscal)}</div>
        </div>
        <div>
          <div style={{ fontSize: 10.5, textTransform: "uppercase", color: "#7D7979", letterSpacing: 0.5 }}>
            Fiscal Substituto
          </div>
          <div style={{ marginTop: 2 }}>{formatarPessoa(processo.fiscal_substituto)}</div>
        </div>
      </div>

      <p style={{ fontSize: 11, color: "#7D7979", marginTop: 8 }}>
        Gestor/Fiscal são só leitura aqui — edite na seção "Gestão e Fiscalização" do processo.
      </p>
    </div>
  );
}
