"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { botaoPrimario, cor, pill } from "@/lib/theme";
import { corEvento } from "@/lib/cores-evento";
import { BotaoCopiar } from "@/app/_ui/campo";
import { sincronizarGoogle } from "@/lib/google-sync-cliente";

type Tag = { id: string; valor: string };

type Andamento = {
  id: string;
  tipo: string;
  texto: string;
  data: string;
  sei_numero: string | null;
  incluir_relatorio: boolean;
  autor: { nome: string } | null;
  tags: Tag[];
  agendamentoData: string | null;
  agendamentoHorario: string | null;
  googleEventId: string | null;
};

const MODELOS: Record<string, string> = {
  "Ofício Atenção":
    "Encaminhado à Contratada o Ofício nº [Nº]/2026/DAF/COFISC/DAF/SECTICS/MS ([SEI]), em [data] ([SEI]), solicitando especial atenção ao fiel cumprimento das cláusulas contratuais e do cronograma de entrega estabelecido em contrato.",
  "Notificação Atraso":
    "A Contratada foi Notificada, através do Ofício nº [Nº]/2026/DAF/COFISC/DAF/SECTICS/MS ([SEI]), em [data] ([SEI]), em razão do atraso no adimplemento contratual, que já somava [N] dias.",
  "Autorização Transcurso":
    "Após análise da Área Técnica da Coordenação-Geral [X], considerando a necessidade de garantir o atendimento e evitar o risco de desabastecimento na rede SUS, em caráter excepcional, foi autorizada a entrega com transcurso de validade, conforme Ofício nº [Nº]/2026/DAF/COFISC/DAF/SECTICS/MS ([SEI]).",
  "Carta Defesa Prévia":
    "A Contratada encaminhou Carta ([SEI]), em [data], apresentando defesa prévia quanto ao [motivo], a qual foi encaminhada à área técnica para manifestação.",
  Avaria:
    "No ato do recebimento da carga foi constatada avaria em [N] unidades, as quais foram devolvidas imediatamente ao fornecedor, o que foi comunicado por meio do Ofício nº [Nº]/2026/DAF/COFISC/DAF/SECTICS/MS ([SEI]), em [data].",
  "Conclusão Regular":
    "Conclui-se pela REGULAR EXECUÇÃO DO CONTRATO Nº [X], não sugerindo aplicação de penalidade à Contratada, por não restar configurado inadimplemento contratual passível de sanção.",
  Outro: "",
};

const TIPOS = Object.keys(MODELOS);

function formatarAgendamento(data: string | null, horario: string | null) {
  if (!data) return null;
  const dataFmt = new Date(`${data}T00:00:00`).toLocaleDateString("pt-BR");
  return horario ? `${dataFmt} ${horario.slice(0, 5)}` : dataFmt;
}

export default function Andamentos({
  processoId,
  autorId,
  numeroContrato,
  andamentos,
  tagsAtivas,
}: {
  processoId: string;
  autorId: string | null;
  numeroContrato: string;
  andamentos: Andamento[];
  tagsAtivas: Tag[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [modalAberto, setModalAberto] = useState(false);
  const [tipo, setTipo] = useState("");
  const [texto, setTexto] = useState("");
  const [seiNumero, setSeiNumero] = useState("");
  const [incluirRelatorio, setIncluirRelatorio] = useState(false);
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [agendamentoData, setAgendamentoData] = useState("");
  const [agendamentoHorario, setAgendamentoHorario] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [carregandoId, setCarregandoId] = useState<string | null>(null);

  function gerarComIA() {
    const modelo = MODELOS[tipo] ?? "";
    setTexto(modelo.replaceAll("[X]", numeroContrato));
  }

  function alternarTag(tagId: string) {
    setTagIds((atual) => (atual.includes(tagId) ? atual.filter((id) => id !== tagId) : [...atual, tagId]));
  }

  function fecharModal() {
    setModalAberto(false);
    setTipo("");
    setTexto("");
    setSeiNumero("");
    setIncluirRelatorio(false);
    setTagIds([]);
    setAgendamentoData("");
    setAgendamentoHorario("");
    setErro(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setSalvando(true);

    const { data: criado, error } = await supabase
      .from("andamentos")
      .insert({
        processo_id: processoId,
        tipo,
        texto,
        sei_numero: seiNumero || null,
        autor_id: autorId,
        incluir_relatorio: incluirRelatorio,
        agendamento_data: agendamentoData || null,
        agendamento_horario: agendamentoHorario || null,
      })
      .select("id")
      .single();

    if (error || !criado) {
      setSalvando(false);
      setErro(error?.message ?? "Erro ao salvar");
      return;
    }

    if (tagIds.length > 0) {
      const { error: erroTags } = await supabase
        .from("andamento_tags")
        .insert(tagIds.map((tagId) => ({ andamento_id: criado.id, tag_id: tagId })));
      if (erroTags) {
        setSalvando(false);
        setErro(erroTags.message);
        return;
      }
    }

    if (agendamentoData && agendamentoHorario) {
      sincronizarGoogle({
        tipo: "andamento",
        acao: "salvar",
        id: criado.id,
        googleEventId: null,
        numeroContrato,
        descricao: texto.trim() || tipo,
        data: agendamentoData,
        horario: agendamentoHorario,
        processoId,
      });
    }

    setSalvando(false);
    fecharModal();
    router.refresh();
  }

  async function alternarInclusao(a: Andamento) {
    setErro(null);
    setCarregandoId(a.id);
    const { error } = await supabase
      .from("andamentos")
      .update({ incluir_relatorio: !a.incluir_relatorio })
      .eq("id", a.id);
    setCarregandoId(null);
    if (error) {
      setErro(error.message);
      return;
    }
    router.refresh();
  }

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <p style={{ fontSize: 11.5, color: cor.textoTerciario, margin: 0 }}>
          "Incluir no relatório" define o que entra na seção 5 (Ocorrências) do Relatório.
        </p>
        <button
          type="button"
          onClick={() => setModalAberto(true)}
          style={{ ...botaoPrimario, fontSize: 11.5, padding: "6px 14px", whiteSpace: "nowrap" }}
        >
          + Criar andamento
        </button>
      </div>

      {erro && !modalAberto && <p style={{ color: cor.urgente, margin: 0 }}>{erro}</p>}

      <div style={{ display: "flex", flexDirection: "column" }}>
        {andamentos.length === 0 && (
          <span style={{ color: cor.textoTerciario, fontSize: 13 }}>Nenhum andamento registrado.</span>
        )}
        {andamentos.map((a) => (
          <div key={a.id} style={{ borderBottom: `1px solid ${cor.borda}`, padding: "10px 0" }}>
            <div style={{ fontSize: 11.5, color: cor.textoTerciario }}>
              {new Date(a.data).toLocaleString("pt-BR")} · {a.tipo}
              {a.autor?.nome ? ` · ${a.autor.nome}` : ""}
              {a.sei_numero ? ` · SEI ${a.sei_numero}` : ""}
            </div>
            <div style={{ fontSize: 13, marginTop: 3 }}>{a.texto}</div>
            {(a.tags.length > 0 || a.agendamentoData) && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                {a.tags.map((t) => {
                  const c = corEvento(t.id);
                  return (
                    <span key={t.id} style={{ ...pill, background: c.fundo, color: c.texto }}>
                      {t.valor}
                    </span>
                  );
                })}
                {a.agendamentoData && (
                  <span style={{ ...pill, background: cor.destaqueFundo, color: cor.destaque }}>
                    {formatarAgendamento(a.agendamentoData, a.agendamentoHorario)}
                  </span>
                )}
              </div>
            )}
            <div style={{ display: "flex", gap: 8, marginTop: 6, alignItems: "center" }}>
              <label style={{ fontSize: 11.5, display: "flex", alignItems: "center", gap: 4 }}>
                <input
                  type="checkbox"
                  checked={a.incluir_relatorio}
                  disabled={carregandoId === a.id}
                  onChange={() => alternarInclusao(a)}
                />
                Incluir no relatório
              </label>
              <BotaoCopiar texto={a.texto} />
            </div>
          </div>
        ))}
      </div>

      {modalAberto && (
        <div
          onClick={fecharModal}
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
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSubmit}
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: 18,
              width: "100%",
              maxWidth: 460,
              maxHeight: "85vh",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <strong style={{ fontSize: 13 }}>Criar andamento</strong>
              <button
                type="button"
                onClick={fecharModal}
                aria-label="Fechar"
                style={{ width: 26, height: 26, borderRadius: "50%", border: "none", background: "rgba(32,31,29,.08)" }}
              >
                ×
              </button>
            </div>

            <select value={tipo} onChange={(e) => setTipo(e.target.value)} required style={{ padding: 8 }}>
              <option value="">Selecione o tipo</option>
              {TIPOS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <textarea
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Texto do andamento — as lacunas [ ] são editáveis."
                required
                style={{ padding: 8, flex: 1 }}
              />
              <button
                type="button"
                onClick={gerarComIA}
                disabled={!tipo}
                style={{ color: cor.destaque, background: cor.destaqueFundo, fontSize: 11.5, whiteSpace: "nowrap" }}
              >
                ✦ Gerar com IA
              </button>
            </div>

            <input
              value={seiNumero}
              onChange={(e) => setSeiNumero(e.target.value)}
              placeholder="Nº SEI (opcional)"
              style={{ padding: 8 }}
            />

            {tagsAtivas.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 500,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    color: cor.textoTerciario,
                  }}
                >
                  Tags de eventos relacionadas
                </span>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {tagsAtivas.map((t) => {
                    const c = corEvento(t.id);
                    const ativa = tagIds.includes(t.id);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => alternarTag(t.id)}
                        style={{
                          ...pill,
                          border: "none",
                          cursor: "pointer",
                          background: ativa ? c.fundo : "rgba(96,93,93,.10)",
                          color: ativa ? c.texto : cor.textoSecundario,
                        }}
                      >
                        {t.valor}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  color: cor.textoTerciario,
                }}
              >
                Agendamento (opcional)
              </span>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="date"
                  value={agendamentoData}
                  onChange={(e) => setAgendamentoData(e.target.value)}
                  style={{ padding: 8, flex: 1 }}
                />
                <input
                  type="time"
                  value={agendamentoHorario}
                  onChange={(e) => setAgendamentoHorario(e.target.value)}
                  style={{ padding: 8, flex: 1 }}
                />
              </div>
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={incluirRelatorio}
                onChange={(e) => setIncluirRelatorio(e.target.checked)}
              />
              Incluir no relatório
            </label>

            {erro && <p style={{ color: cor.urgente, margin: 0 }}>{erro}</p>}

            <button type="submit" disabled={salvando} style={botaoPrimario}>
              {salvando ? "Salvando..." : "Criar"}
            </button>
          </form>
        </div>
      )}
    </section>
  );
}
