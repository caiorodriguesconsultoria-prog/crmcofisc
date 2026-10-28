import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { cor, card } from "@/lib/theme";
import { corEvento } from "@/lib/cores-evento";
import Painel from "@/app/_ui/painel";
import MedidorCircular from "@/app/_ui/medidor-circular";
import { getTagsEvento } from "@/lib/dados-referencia";
import { calcularDerivadosEntregas } from "@/lib/entregas-derivados";

const MS_POR_DIA = 1000 * 60 * 60 * 24;

function media(valores: number[]) {
  if (valores.length === 0) return null;
  return valores.reduce((soma, v) => soma + v, 0) / valores.length;
}

function formatarDias(dias: number | null) {
  if (dias === null) return "sem dados";
  return `${dias.toFixed(1)} dias`;
}

export default async function DadosPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  if (!user) {
    redirect("/login");
  }

  const [
    { data: processos },
    { count: totalProcessos },
    { data: tagHistorico },
    eventos,
    { data: assinaturaHistorico },
    { data: entregas },
    { data: pautaTodas },
  ] = await Promise.all([
    supabase.from("processos").select("id, created_at, updated_at, conclusao_tipo"),
    supabase.from("processos").select("id", { count: "exact", head: true }),
    supabase.from("processo_tag_historico").select("processo_id, tag_id"),
    getTagsEvento(),
    supabase
      .from("processo_kanban_historico")
      .select("entrada_em, saida_em")
      .eq("kanban", "Aguardando assinatura")
      .not("saida_em", "is", null),
    supabase
      .from("processo_entregas")
      .select("id, processo_id, local_entrega, quantidade, data_entrega, data_fabricacao, data_validade"),
    supabase.from("processo_pauta_distribuicao").select("processo_id, uf, quantidade, data_entrega"),
  ]);

  const total = totalProcessos ?? 0;

  const processosPorTag = new Map<string, Set<string>>();
  for (const h of tagHistorico ?? []) {
    const set = processosPorTag.get(h.tag_id) ?? new Set<string>();
    set.add(h.processo_id);
    processosPorTag.set(h.tag_id, set);
  }
  const percentualPorEvento = (eventos ?? []).map((ev) => ({
    ...ev,
    percentual: total > 0 ? ((processosPorTag.get(ev.id)?.size ?? 0) / total) * 100 : 0,
    quantidade: processosPorTag.get(ev.id)?.size ?? 0,
  }));

  const diasAssinatura = (assinaturaHistorico ?? []).map(
    (h) => (new Date(h.saida_em as string).getTime() - new Date(h.entrada_em).getTime()) / MS_POR_DIA,
  );
  const mediaAssinatura = media(diasAssinatura);

  const concluidos = (processos ?? []).filter((p) => p.conclusao_tipo);
  const diasConclusao = concluidos.map(
    (p) => (new Date(p.updated_at).getTime() - new Date(p.created_at).getTime()) / MS_POR_DIA,
  );
  const mediaConclusao = media(diasConclusao);

  // Atraso não fica mais salvo em processo_entregas — calculado por
  // contrato (cruzando com a Pauta de Distribuição, ver
  // lib/entregas-derivados.ts), já que só faz sentido comparar UFs dentro
  // do mesmo contrato.
  const pautaPorProcesso = new Map<string, typeof pautaTodas>();
  for (const p of pautaTodas ?? []) {
    const lista = pautaPorProcesso.get(p.processo_id) ?? [];
    lista.push(p);
    pautaPorProcesso.set(p.processo_id, lista as any);
  }
  const entregasPorProcesso = new Map<string, typeof entregas>();
  for (const e of entregas ?? []) {
    const lista = entregasPorProcesso.get(e.processo_id) ?? [];
    lista.push(e);
    entregasPorProcesso.set(e.processo_id, lista as any);
  }
  const diasAtrasoTodos: number[] = [];
  const processosComAtrasoSet = new Set<string>();
  for (const [processoId, listaEntregas] of entregasPorProcesso) {
    const { atrasoPorId } = calcularDerivadosEntregas(listaEntregas ?? [], (pautaPorProcesso.get(processoId) ?? []) as any);
    for (const dias of atrasoPorId.values()) {
      if (dias && dias > 0) {
        diasAtrasoTodos.push(dias);
        processosComAtrasoSet.add(processoId);
      }
    }
  }
  const processosComAtraso = processosComAtrasoSet.size;
  const mediaAtraso = media(diasAtrasoTodos);

  return (
    <Painel titulo="Dados" subtitulo="KPIs de contratos" voltarHref="/dashboard" maxWidth={1000}>
      <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {[
            { rotulo: "Tempo médio aguardando assinatura", valor: formatarDias(mediaAssinatura), cor: cor.amarelo, fundo: cor.amareloFundo },
            { rotulo: "Tempo médio de conclusão", valor: formatarDias(mediaConclusao), cor: cor.positivo, fundo: cor.positivoFundo },
            {
              rotulo: "Contratos entregues com atraso",
              valor: String(processosComAtraso),
              cor: processosComAtraso > 0 ? cor.urgente : cor.textoSecundario,
              fundo: processosComAtraso > 0 ? cor.urgenteFundo : cor.fundo,
            },
            { rotulo: "Tempo médio de atraso (dos que atrasaram)", valor: formatarDias(mediaAtraso), cor: cor.laranja, fundo: cor.laranjaFundo },
          ].map((kpi) => (
            <div
              key={kpi.rotulo}
              style={{
                ...card,
                flex: "1 1 220px",
                display: "flex",
                flexDirection: "column",
                background: kpi.fundo,
                border: "none",
                borderTop: `3px solid ${kpi.cor}`,
              }}
            >
              <span
                style={{
                  fontSize: 10.5,
                  textTransform: "uppercase",
                  color: cor.textoSecundario,
                  fontWeight: 600,
                  letterSpacing: 0.5,
                  minHeight: 28,
                  display: "block",
                }}
              >
                {kpi.rotulo}
              </span>
              <p style={{ fontSize: 24, fontWeight: 700, margin: "4px 0 0", color: kpi.cor }}>{kpi.valor}</p>
            </div>
          ))}
        </div>

        <div style={card}>
          <strong style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: cor.destaque }} />
            % de contratos por evento
          </strong>
          <p style={{ fontSize: 12, color: cor.textoTerciario, margin: "2px 0 10px" }}>
            De todos os contratos, quantos já tiveram cada evento alguma vez — cada evento é
            um medidor independente (um contrato pode ter passado por vários eventos, então
            cada um tem seu próprio total, em vez de dividir uma pizza só).
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(88px, 1fr))", gap: 14 }}>
            {percentualPorEvento.map((ev) => {
              const c = corEvento(ev.id, ev.cor);
              return (
                <MedidorCircular
                  key={ev.id}
                  valor={ev.quantidade}
                  total={total}
                  corPreenchido={c.texto}
                  corTrilha={c.fundo}
                  rotulo={ev.valor}
                  tamanho={72}
                />
              );
            })}
            {percentualPorEvento.length === 0 && (
              <p style={{ color: cor.textoTerciario, fontSize: 13, margin: 0 }}>Nenhum evento cadastrado ainda.</p>
            )}
          </div>
        </div>
      </div>
    </Painel>
  );
}
