"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { botaoPrimario, cor } from "@/lib/theme";
import { BotaoCopiar } from "@/app/_ui/campo";

type Tipo = "Regular" | "Irregular";

type Conclusao = {
  tipo: Tipo | null;
  checks: string[] | null;
  texto: string | null;
  penalidade: string | null;
};

const CONCL_DEFS: Record<Tipo, { checks: string[]; texto: (cn: string) => string }> = {
  Regular: {
    checks: [
      "que a Contratada executou integralmente o Contrato",
      "que não houve atraso na entrega das parcelas",
      "a conclusão dos pagamentos",
    ],
    texto: (cn) =>
      `Conclui-se pela REGULAR EXECUÇÃO DO CONTRATO Nº ${cn}, não sugerindo aplicação de penalidade à Contratada, por não restar configurado inadimplemento contratual passível de sanção, sem prejuízo do registro das ocorrências para fins de acompanhamento e monitoramento da execução contratual.`,
  },
  Irregular: {
    checks: [
      "que a Contratada não executou integralmente o Contrato",
      "atraso de [N] dias na entrega",
      "saldo a pagar pendente de regularização",
    ],
    texto: (cn) =>
      `Conclui-se que a execução do Contrato nº ${cn} apresenta indício de descumprimento de cláusulas contratuais, até o momento.`,
  },
};

export default function Conclusao({
  processoId,
  numeroContrato,
  conclusao,
}: {
  processoId: string;
  numeroContrato: string;
  conclusao: Conclusao;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [editando, setEditando] = useState(false);
  const [tipo, setTipo] = useState<Tipo | null>(conclusao.tipo);
  const [checks, setChecks] = useState<string[]>(conclusao.checks ?? []);
  const [texto, setTexto] = useState(conclusao.texto ?? "");
  const [penalidade, setPenalidade] = useState(conclusao.penalidade ?? "");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  function escolherTipo(t: Tipo) {
    setTipo(t);
    setChecks(CONCL_DEFS[t].checks.slice());
    setTexto(CONCL_DEFS[t].texto(numeroContrato));
    setPenalidade("");
  }

  function cancelar() {
    setTipo(conclusao.tipo);
    setChecks(conclusao.checks ?? []);
    setTexto(conclusao.texto ?? "");
    setPenalidade(conclusao.penalidade ?? "");
    setErro(null);
    setEditando(false);
  }

  async function salvar() {
    setErro(null);
    setSalvando(true);
    const { error } = await supabase
      .from("processos")
      .update({
        conclusao_tipo: tipo,
        conclusao_checks: tipo ? checks : null,
        conclusao_texto: tipo ? texto : null,
        conclusao_penalidade: tipo === "Irregular" ? penalidade || null : null,
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

  function textoCopia(t: string, p: string | null) {
    return t + (p ? `\n\nSugestão de penalidade: ${p}` : "");
  }

  if (!editando) {
    return (
      <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <strong>Conclusões</strong>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: conclusao.tipo ? "#4A6B52" : "#8A6A3B",
              background: conclusao.tipo ? "rgba(126,155,126,.18)" : "rgba(182,130,53,.08)",
              borderRadius: 20,
              padding: "2px 10px",
            }}
          >
            {conclusao.tipo ? "Concluído ✓" : "Pendente"}
          </span>
          <button onClick={() => setEditando(true)} style={{ marginLeft: "auto", fontSize: 11 }}>
            Editar
          </button>
        </div>

        {!conclusao.tipo ? (
          <p style={{ color: cor.textoTerciario, margin: 0, fontSize: 13 }}>Ainda não definida.</p>
        ) : (
          <div>
            <p style={{ margin: "0 0 8px", fontSize: 13 }}>Execução {conclusao.tipo.toLowerCase()}</p>
            <p style={{ fontSize: 11.5, color: cor.textoTerciario, margin: "0 0 4px" }}>
              Diante do exposto, considerando:
            </p>
            <ul style={{ margin: "0 0 8px", paddingLeft: 20 }}>
              {(conclusao.checks ?? []).map((c, i) => (
                <li key={i} style={{ fontSize: 13 }}>
                  {c}
                </li>
              ))}
            </ul>
            <p style={{ textAlign: "justify", margin: 0, fontSize: 13 }}>{conclusao.texto}</p>
            {conclusao.penalidade && (
              <p style={{ margin: "8px 0 0", fontSize: 13 }}>
                <strong>Sugestão de penalidade:</strong> {conclusao.penalidade}
              </p>
            )}
            <div style={{ marginTop: 8 }}>
              <BotaoCopiar texto={textoCopia(conclusao.texto ?? "", conclusao.penalidade)} />
            </div>
          </div>
        )}
      </section>
    );
  }

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <strong>Conclusões</strong>

      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          onClick={() => escolherTipo("Regular")}
          style={
            tipo === "Regular"
              ? { ...botaoPrimario, flex: 1, textAlign: "center" }
              : { flex: 1, color: cor.textoSecundario, background: "rgba(96,93,93,.10)", border: "none" }
          }
        >
          Execução regular
        </button>
        <button
          type="button"
          onClick={() => escolherTipo("Irregular")}
          style={
            tipo === "Irregular"
              ? { ...botaoPrimario, flex: 1, textAlign: "center" }
              : { flex: 1, color: cor.textoSecundario, background: "rgba(96,93,93,.10)", border: "none" }
          }
        >
          Execução irregular
        </button>
      </div>
      <p style={{ fontSize: 11, color: cor.textoTerciario, margin: 0 }}>
        Trocar o tipo reinicia o checklist e o texto abaixo para o modelo padrão.
      </p>

      {tipo && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={{ fontSize: 11.5, color: cor.textoTerciario }}>Diante do exposto, considerando:</span>
          {checks.map((c, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                value={c}
                onChange={(e) => {
                  const a = checks.slice();
                  a[i] = e.target.value;
                  setChecks(a);
                }}
                style={{ padding: 6, flex: 1 }}
              />
              <button
                type="button"
                onClick={() => setChecks(checks.filter((_, j) => j !== i))}
                style={{ fontSize: 10.5, padding: "3px 8px" }}
              >
                remover
              </button>
            </div>
          ))}

          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            style={{ padding: 8, minHeight: 96 }}
          />

          {tipo === "Irregular" && (
            <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 11.5 }}>
              Sugestão de penalidade (opcional)
              <input
                value={penalidade}
                onChange={(e) => setPenalidade(e.target.value)}
                placeholder="ex.: advertência, multa de 0,5% por dia de atraso"
                style={{ padding: 6 }}
              />
            </label>
          )}

          <div style={{ alignSelf: "flex-start" }}>
            <BotaoCopiar texto={textoCopia(texto, tipo === "Irregular" ? penalidade : null)} />
          </div>
        </div>
      )}

      {erro && <p style={{ color: cor.urgente, margin: 0 }}>{erro}</p>}
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={salvar} disabled={salvando} style={botaoPrimario}>
          {salvando ? "Salvando..." : "Salvar"}
        </button>
        <button onClick={cancelar} disabled={salvando}>
          Cancelar
        </button>
      </div>
    </section>
  );
}
