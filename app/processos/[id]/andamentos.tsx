"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { botaoPrimario, cor } from "@/lib/theme";
import { BotaoCopiar } from "@/app/_ui/campo";

type Andamento = {
  id: string;
  tipo: string;
  texto: string;
  data: string;
  sei_numero: string | null;
  incluir_relatorio: boolean;
  autor: { nome: string } | null;
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

export default function Andamentos({
  processoId,
  autorId,
  numeroContrato,
  andamentos,
}: {
  processoId: string;
  autorId: string | null;
  numeroContrato: string;
  andamentos: Andamento[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [tipo, setTipo] = useState("");
  const [texto, setTexto] = useState("");
  const [seiNumero, setSeiNumero] = useState("");
  const [incluirRelatorio, setIncluirRelatorio] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [carregandoId, setCarregandoId] = useState<string | null>(null);

  function gerarComIA() {
    const modelo = MODELOS[tipo] ?? "";
    setTexto(modelo.replaceAll("[X]", numeroContrato));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setSalvando(true);

    const { error } = await supabase.from("andamentos").insert({
      processo_id: processoId,
      tipo,
      texto,
      sei_numero: seiNumero || null,
      autor_id: autorId,
      incluir_relatorio: incluirRelatorio,
    });

    setSalvando(false);

    if (error) {
      setErro(error.message);
      return;
    }

    setTipo("");
    setTexto("");
    setSeiNumero("");
    setIncluirRelatorio(false);
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
      <p style={{ fontSize: 11.5, color: cor.textoTerciario, margin: 0 }}>
        "Incluir no relatório" define o que entra na seção 5 (Ocorrências) do Relatório.
      </p>

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

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
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
          {salvando ? "Salvando..." : "Registrar andamento"}
        </button>
      </form>
    </section>
  );
}
