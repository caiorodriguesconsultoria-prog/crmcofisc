import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { cor, card } from "@/lib/theme";
import { corEvento } from "@/lib/cores-evento";
import Painel from "@/app/_ui/painel";
import MedidorCircular from "@/app/_ui/medidor-circular";
import { getTagsEvento } from "@/lib/dados-referencia";

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
    supabase.from("processo_entregas").select("processo_id, atraso_dias"),
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

  const entregasComAtraso = (entregas ?? []).filter((e) => (e.atraso_dias ?? 0) > 0);
  const processosComAtraso = new Set(entregasComAtraso.map((e) => e.processo_id)).size;
  const mediaAtraso = media(entregasComAtraso.map((e) => e.atraso_dias as number));

  return (
    <Painel titulo="Dados" subtitulo="KPIs de contratos" voltarHref="/dashboard" maxWidth={1000}>
      <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {[
            { rotulo: "Tempo médio aguardando assinatura", valor: formatarDias(mediaAssinatura) },
            { rotulo: "Tempo médio de conclusão", valor: formatarDias(mediaConclusao) },
            {
              rotulo: "Contratos entregues com atraso",
              valor: String(processosComAtraso),
              cor: processosComAtraso > 0 ? cor.urgente : undefined,
            },
            { rotulo: "Tempo médio de atraso (dos que atrasaram)", valor: formatarDias(mediaAtraso) },
          ].map((kpi) => (
            <div key={kpi.rotulo} style={{ ...card, flex: "1 1 220px", display: "flex", flexDirection: "column" }}>
              <span
                style={{
                  fontSize: 10.5,
                  textTransform: "uppercase",
                  color: cor.textoTerciario,
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
          <strong style={{ fontSize: 13 }}>% de processos por evento</strong>
          <p style={{ fontSize: 12, color: cor.textoTerciario, margin: "2px 0 10px" }}>
            De todos os processos, quantos já tiveram cada evento alguma vez — cada evento é
            um medidor independente (um processo pode ter passado por vários eventos, então
            cada um tem seu próprio total, em vez de dividir uma pizza só).
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            {percentualPorEvento.map((ev) => {
              const c = corEvento(ev.id);
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
