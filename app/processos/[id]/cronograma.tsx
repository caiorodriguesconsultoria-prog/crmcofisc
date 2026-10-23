"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cor } from "@/lib/theme";
import { CampoMascarado } from "@/app/_ui/campo";

type Periodo = "manha" | "tarde";
type TipoLancamento = "total" | "parcial" | "avaria";
type LancamentoEntrega = {
  id: string;
  tipo: TipoLancamento;
  lancamento_pai_id: string | null;
  quantidade_normal: number;
  quantidade_avaria: number;
  quantidade_desvio: number;
  data_entrega: string | null;
  data_limite: string | null;
  processo_nups: { id: string; tipo: "entrega" | "pagamento"; nup: string | null }[];
};
type Execucao = {
  id: string;
  numero: number;
  quantidade: number;
  data_prevista: string | null;
  periodo: Periodo | null;
  data_entrega: string | null;
  situacao: string;
  processo_entrega_lancamentos: LancamentoEntrega[];
};

type Item = {
  id: string;
  numero: number;
  descricao: string;
  catmat: string | null;
  unidade_medida: string | null;
  quantidade: number | null;
  valor_unitario: number | null;
  execucoes: Execucao[];
};

type Tag = { id: string; valor: string };

const SITUACOES = ["pendente", "em_transito", "entregue", "atrasada"];

// Máscara de milhar em tempo real (padrão brasileiro: ponto pra milhar,
// vírgula pra decimal) — campo type=number não aceita ponto como separador
// de milhar, então números grandes digitados direto (ex.: "1.300.000")
// ficavam truncados/rejeitados. Aqui é um campo de texto comum que
// reformata a cada tecla digitada.
function formatarNumeroBR(valorDigitado: string): string {
  const limpo = valorDigitado.replace(/[^\d,]/g, "");
  const [inteiroBruto, ...resto] = limpo.split(",");
  const inteiro = inteiroBruto.replace(/^0+(?=\d)/, "");
  const inteiroFormatado = inteiro ? Number(inteiro).toLocaleString("pt-BR") : "";
  const decimal = resto.length > 0 ? "," + resto.join("").slice(0, 3) : "";
  return inteiroFormatado + decimal;
}

function paraNumero(valorFormatado: string): number {
  const normalizado = valorFormatado.replace(/\./g, "").replace(",", ".");
  return normalizado ? Number(normalizado) : 0;
}

function formatarQuantidade(n: number) {
  return n.toLocaleString("pt-BR");
}

function formatarMoeda(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Total já lançado numa parcela (soma dos lançamentos total/parcial, cada um
// podendo ter normal + avaria + desvio no mesmo registro). Lançamentos de
// reposição de avaria NÃO entram aqui — a quantidade já foi contada no
// lançamento original que eles estão corrigindo; somar de novo contaria em
// dobro.
function totalLancado(lancamentos: LancamentoEntrega[]): number {
  // Number(...) explícito em cada parcela da soma: colunas numeric do
  // Postgres podem chegar como string via PostgREST — sem isso, "+" em
  // string vira concatenação de texto em vez de soma, e o total sai
  // completamente errado sem erro nenhum aparecer.
  return lancamentos
    .filter((l) => l.tipo !== "avaria")
    .reduce(
      (soma, l) => soma + Number(l.quantidade_normal) + Number(l.quantidade_avaria) + Number(l.quantidade_desvio),
      0,
    );
}

function nupPorTipo(nups: LancamentoEntrega["processo_nups"], tipo: "entrega" | "pagamento") {
  return nups.find((n) => n.tipo === tipo) ?? null;
}

// Data que de fato define se a parcela atrasou ou não: a mais antiga entre
// as entregas (total/parcial) já lançadas — não o campo manual da parcela
// (data_entrega em processo_execucoes), que só é preenchido ao clicar
// "confirmar entrega" e não acompanha entregas parciais lançadas depois.
// Sem lançamento nenhum, cai no campo manual mesmo (comportamento antigo).
function dataEntregaEfetiva(e: Execucao): string | null {
  const datas = (e.processo_entrega_lancamentos ?? [])
    .filter((l) => l.tipo !== "avaria" && l.data_entrega)
    .map((l) => l.data_entrega as string)
    .sort();
  return datas[0] ?? e.data_entrega;
}

// "Falta" nunca é digitado — é sempre esperado menos o que já foi lançado.
// Pode ficar negativo se lançarem mais do que o previsto (excedente).
function falta(e: Execucao): number {
  return Number(e.quantidade) - totalLancado(e.processo_entrega_lancamentos ?? []);
}

const EVENTO_FALTA = "Falta na Entrega";
const EVENTO_DESVIO = "Desvio de qualidade";
const EVENTO_AVARIA = "Avaria na Entrega";
const EVENTO_ATRASO = "Atraso na entrega";
const PROBLEMAS_ENTREGA = [EVENTO_FALTA, EVENTO_DESVIO, EVENTO_AVARIA];
const ETAPA_CRIACAO_OFICIO = "Criação de Ofício";

const SITUACAO_COR: Record<string, { fg: string; bg: string }> = {
  pendente: { fg: "#8A6A3B", bg: "rgba(182,130,53,.09)" },
  em_transito: { fg: "#7D5411", bg: "rgba(182,130,53,.08)" },
  entregue: { fg: "#4A6B52", bg: "rgba(126,155,126,.18)" },
  atrasada: { fg: "#8C4A42", bg: "rgba(176,101,92,.16)" },
};

// Diferença entre a data prevista e a data em que a entrega de fato
// aconteceu — positivo é atraso, negativo é entrega antecipada, zero é no
// prazo. Só existe depois que data_entrega é lançada.
function diferencaDias(dataPrevista: string | null, dataEntrega: string | null) {
  if (!dataPrevista || !dataEntrega) return null;
  const diffMs = new Date(`${dataEntrega}T00:00:00`).getTime() - new Date(`${dataPrevista}T00:00:00`).getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

// Enquanto a entrega ainda não foi lançada: quantos dias já passaram da data
// prevista — só conta a partir do dia seguinte (hoje == data_prevista ainda
// não é atraso). Usado pra pintar de vermelho e mostrar "X dias em atraso"
// mesmo sem ninguém ter mexido na situação manualmente.
function diasEmAtrasoAgora(dataPrevista: string | null, hoje: string) {
  if (!dataPrevista) return null;
  const diffMs = new Date(`${hoje}T00:00:00`).getTime() - new Date(`${dataPrevista}T00:00:00`).getTime();
  const dias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return dias > 0 ? dias : null;
}

function textoAtraso(
  dataPrevista: string | null,
  dataEntrega: string | null,
  hoje: string,
): { texto: string; destaque: "urgente" | "positivo" | null } {
  if (dataEntrega) {
    const diff = diferencaDias(dataPrevista, dataEntrega);
    if (diff === null) return { texto: "—", destaque: null };
    if (diff > 0) return { texto: `${diff} dia${diff > 1 ? "s" : ""} em atraso`, destaque: "urgente" };
    if (diff < 0) return { texto: `${-diff} dia${-diff > 1 ? "s" : ""} de antecedência`, destaque: "positivo" };
    return { texto: "entregue no prazo", destaque: "positivo" };
  }
  const dias = diasEmAtrasoAgora(dataPrevista, hoje);
  if (dias) return { texto: `${dias} dia${dias > 1 ? "s" : ""} em atraso`, destaque: "urgente" };
  return { texto: "—", destaque: null };
}

function formatarData(data: string | null) {
  return data ? new Date(`${data}T00:00:00`).toLocaleDateString("pt-BR") : "—";
}

function ordinal(n: number) {
  return `${n}ª Parcela`;
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
      <span style={{ fontSize: 9.5, fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.6, color: cor.textoTerciario }}>
        {label}
      </span>
      <div style={{ fontSize: 12.5 }}>{children}</div>
    </div>
  );
}

function CampoQuantidade({ valor, onChange }: { valor: string; onChange: (v: string) => void }) {
  return (
    <Campo label="Quantidade">
      <CampoMascarado
        valor={valor}
        formatar={formatarNumeroBR}
        onChange={onChange}
        style={{ width: 90, padding: 4, textAlign: "center" }}
      />
    </Campo>
  );
}

function SeletorPeriodo({ valor, onChange }: { valor: Periodo | ""; onChange: (p: Periodo) => void }) {
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {(["manha", "tarde"] as Periodo[]).map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onChange(p)}
          style={{
            fontSize: 10.5,
            fontWeight: 600,
            padding: "4px 9px",
            borderRadius: 7,
            border: "none",
            color: valor === p ? cor.destaque : cor.textoTerciario,
            background: valor === p ? cor.destaqueFundo : "rgba(96,93,93,.10)",
          }}
        >
          {p === "manha" ? "Manhã" : "Tarde"}
        </button>
      ))}
    </div>
  );
}

export default function Cronograma({
  processoId,
  itens,
  tagsDisponiveis,
}: {
  processoId: string;
  itens: Item[];
  tagsDisponiveis: Tag[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState<string | null>(null);

  const itensOrdenados = [...itens].sort((a, b) => a.numero - b.numero);
  const [itemSelecionadoId, setItemSelecionadoId] = useState<string | null>(itensOrdenados[0]?.id ?? null);
  const itemSelecionado = itensOrdenados.find((i) => i.id === itemSelecionadoId) ?? null;

  const [novoItem, setNovoItem] = useState(false);
  const [editandoItem, setEditandoItem] = useState(false);
  const [itemForm, setItemForm] = useState({
    descricao: "",
    catmat: "",
    unidade_medida: "",
    quantidade: "",
    valor_unitario: "",
  });
  const [salvandoItem, setSalvandoItem] = useState(false);

  const execucoes = itemSelecionado?.execucoes ?? [];

  const [editando, setEditando] = useState(false);
  const [edicao, setEdicao] = useState<{
    quantidade: string;
    data_prevista: string;
    periodo: Periodo | "";
    data_entrega: string;
  } | null>(null);
  const [novo, setNovo] = useState(false);
  const [novaQuantidade, setNovaQuantidade] = useState("");
  const [novaData, setNovaData] = useState("");
  const [novoPeriodo, setNovoPeriodo] = useState<Periodo | "">("");
  const hoje = new Date().toISOString().slice(0, 10);

  const execucoesOrdenadas = [...execucoes].sort((a, b) => a.numero - b.numero);
  const [parcelaSelecionadaId, setParcelaSelecionadaId] = useState<string | null>(
    execucoesOrdenadas[0]?.id ?? null,
  );
  const selecionada = execucoesOrdenadas.find((e) => e.id === parcelaSelecionadaId) ?? null;

  const [criandoLancamento, setCriandoLancamento] = useState(false);
  const [novoLancTipo, setNovoLancTipo] = useState<"total" | "parcial">("parcial");
  const [novoLancData, setNovoLancData] = useState(hoje);
  const [novoLancNormal, setNovoLancNormal] = useState("");
  const [novoLancAvaria, setNovoLancAvaria] = useState("");
  const [novoLancDesvio, setNovoLancDesvio] = useState("");
  const [salvandoLancamento, setSalvandoLancamento] = useState(false);
  const [removendoLancamentoId, setRemovendoLancamentoId] = useState<string | null>(null);

  // Reposição de avaria: lançamento "filho" de um total/parcial que teve
  // quantidade avariada — só precisa de prazo + quantidade, nunca tem NUP
  // próprio (reusa o NUP de entrega/pagamento do lançamento pai).
  const [lancandoAvariaDeId, setLancandoAvariaDeId] = useState<string | null>(null);
  const [avariaData, setAvariaData] = useState("");
  const [avariaQuantidade, setAvariaQuantidade] = useState("");
  const [salvandoAvaria, setSalvandoAvaria] = useState(false);

  const [confirmandoId, setConfirmandoId] = useState<string | null>(null);
  const [etapaConfirmacao, setEtapaConfirmacao] = useState<"pergunta" | "problemas" | null>(null);
  const [problemasMarcados, setProblemasMarcados] = useState<string[]>([]);
  const [processandoConfirmacao, setProcessandoConfirmacao] = useState(false);

  function selecionarItem(id: string) {
    setItemSelecionadoId(id);
    setNovoItem(false);
    setEditandoItem(false);
    setNovo(false);
    setEditando(false);
    fecharConfirmacao();
    const doItem = itensOrdenados.find((i) => i.id === id);
    setParcelaSelecionadaId([...(doItem?.execucoes ?? [])].sort((a, b) => a.numero - b.numero)[0]?.id ?? null);
  }

  function abrirNovoItem() {
    setNovoItem(true);
    setEditandoItem(false);
    setItemForm({ descricao: "", catmat: "", unidade_medida: "", quantidade: "", valor_unitario: "" });
  }

  function abrirEdicaoItem() {
    if (!itemSelecionado) return;
    setEditandoItem(true);
    setNovoItem(false);
    setItemForm({
      descricao: itemSelecionado.descricao,
      catmat: itemSelecionado.catmat ?? "",
      unidade_medida: itemSelecionado.unidade_medida ?? "",
      quantidade: itemSelecionado.quantidade != null ? formatarQuantidade(itemSelecionado.quantidade) : "",
      valor_unitario: itemSelecionado.valor_unitario != null ? String(itemSelecionado.valor_unitario) : "",
    });
  }

  const proximoNumeroItem = itens.length > 0 ? Math.max(...itens.map((i) => i.numero)) + 1 : 1;

  async function salvarNovoItem() {
    if (!itemForm.descricao.trim()) return;
    setErro(null);
    setSalvandoItem(true);
    const { data: criado, error } = await supabase
      .from("processo_itens")
      .insert({
        processo_id: processoId,
        numero: proximoNumeroItem,
        descricao: itemForm.descricao.trim(),
        catmat: itemForm.catmat.trim() || null,
        unidade_medida: itemForm.unidade_medida.trim() || null,
        quantidade: itemForm.quantidade ? paraNumero(itemForm.quantidade) : null,
        valor_unitario: itemForm.valor_unitario ? Number(itemForm.valor_unitario.replace(",", ".")) : null,
      })
      .select("id")
      .single();
    setSalvandoItem(false);
    if (error) {
      setErro(error.message);
      return;
    }
    setNovoItem(false);
    if (criado) setItemSelecionadoId(criado.id);
    router.refresh();
  }

  // Anexar o contrato (PDF) ou uma foto/imagem da tabela de itens/cronograma
  // já cadastra os itens extraídos (e as parcelas de cada um, se o anexo
  // trouxer o cronograma de entrega) — útil pra contratos que já existem no
  // sistema sem itens ainda, ou pra acrescentar itens que faltaram. Nunca
  // mexe nos itens já cadastrados, só adiciona novos a partir do que a IA
  // conseguiu ler.
  const [extraindoAnexo, setExtraindoAnexo] = useState(false);
  const [erroAnexo, setErroAnexo] = useState<string | null>(null);

  async function processarAnexo(arquivo: File) {
    setErroAnexo(null);
    setExtraindoAnexo(true);
    try {
      const formData = new FormData();
      formData.append("arquivo", arquivo);
      const resp = await fetch("/api/processos/extrair-pdf", { method: "POST", body: formData });
      const corpo = await resp.json();
      if (!resp.ok) {
        setErroAnexo(corpo.error ?? "Não deu pra extrair os dados do anexo.");
        return;
      }
      const dadosItens = Array.isArray(corpo.dados?.itens) ? corpo.dados.itens : [];
      if (dadosItens.length === 0) {
        setErroAnexo("Não encontrei nenhum item nesse anexo.");
        return;
      }

      let proximoNumero = proximoNumeroItem;
      let primeiroItemId: string | null = null;
      for (const it of dadosItens) {
        const { data: itemCriado, error: erroItem } = await supabase
          .from("processo_itens")
          .insert({
            processo_id: processoId,
            numero: proximoNumero,
            descricao: it.descricao || `Item ${proximoNumero}`,
            catmat: it.catmat || null,
            unidade_medida: it.unidade_medida || null,
            quantidade: it.quantidade ?? null,
            valor_unitario: it.valor_unitario ?? null,
          })
          .select("id")
          .single();
        if (erroItem || !itemCriado) {
          setErroAnexo(erroItem?.message ?? "Erro ao criar item extraído.");
          break;
        }
        if (!primeiroItemId) primeiroItemId = itemCriado.id;

        const parcelas = Array.isArray(it.parcelas) ? it.parcelas : [];
        if (parcelas.length > 0) {
          await supabase.from("processo_execucoes").insert(
            parcelas
              .filter((p: any) => p.numero != null && p.quantidade != null)
              .map((p: any) => ({
                processo_id: processoId,
                item_id: itemCriado.id,
                numero: p.numero,
                quantidade: p.quantidade,
                data_prevista: p.data_prevista ?? null,
              })),
          );
        }
        proximoNumero++;
      }

      if (primeiroItemId) setItemSelecionadoId(primeiroItemId);
      router.refresh();
    } catch {
      setErroAnexo("Não deu pra extrair os dados do anexo.");
    } finally {
      setExtraindoAnexo(false);
    }
  }

  async function salvarEdicaoItem() {
    if (!itemSelecionado || !itemForm.descricao.trim()) return;
    setErro(null);
    setSalvandoItem(true);
    const { error } = await supabase
      .from("processo_itens")
      .update({
        descricao: itemForm.descricao.trim(),
        catmat: itemForm.catmat.trim() || null,
        unidade_medida: itemForm.unidade_medida.trim() || null,
        quantidade: itemForm.quantidade ? paraNumero(itemForm.quantidade) : null,
        valor_unitario: itemForm.valor_unitario ? Number(itemForm.valor_unitario.replace(",", ".")) : null,
      })
      .eq("id", itemSelecionado.id);
    setSalvandoItem(false);
    if (error) {
      setErro(error.message);
      return;
    }
    setEditandoItem(false);
    router.refresh();
  }

  async function removerItem() {
    if (!itemSelecionado) return;
    if (itens.length <= 1) {
      setErro("O contrato precisa ter pelo menos um item.");
      return;
    }
    if (!confirm(`Remover "${itemSelecionado.descricao}" e todas as suas parcelas/entregas lançadas?`)) return;
    setErro(null);
    setSalvandoItem(true);
    const { error } = await supabase.from("processo_itens").delete().eq("id", itemSelecionado.id);
    setSalvandoItem(false);
    if (error) {
      setErro(error.message);
      return;
    }
    setItemSelecionadoId(null);
    router.refresh();
  }

  function fecharConfirmacao() {
    setConfirmandoId(null);
    setEtapaConfirmacao(null);
    setProblemasMarcados([]);
  }

  function alternarProblema(valor: string) {
    setProblemasMarcados((atual) => (atual.includes(valor) ? atual.filter((v) => v !== valor) : [...atual, valor]));
  }

  function idDaTag(valor: string) {
    return tagsDisponiveis.find((t) => t.valor === valor)?.id ?? null;
  }

  async function adicionarEventoSeNovo(tagId: string) {
    const { data: existente } = await supabase
      .from("processo_tags")
      .select("tag_id")
      .eq("processo_id", processoId)
      .eq("tag_id", tagId)
      .maybeSingle();
    if (!existente) {
      await supabase.from("processo_tags").insert({ processo_id: processoId, tag_id: tagId });
    }
  }

  // Muda a etapa do processo pra "Criação de Ofício" e devolve o id do
  // histórico de kanban aberto (novo ou já existente, se já estava nessa
  // etapa) — é nele que a tarefa de criar ofício é pendurada, pra aparecer
  // no checklist visível da etapa atual.
  async function mudarEtapaCriacaoOficio(): Promise<string | null> {
    await supabase.from("processos").update({ etapa_atual: ETAPA_CRIACAO_OFICIO }).eq("id", processoId);
    const { data: historico } = await supabase
      .from("processo_kanban_historico")
      .select("id")
      .eq("processo_id", processoId)
      .is("saida_em", null)
      .order("entrada_em", { ascending: false })
      .limit(1)
      .maybeSingle();
    return historico?.id ?? null;
  }

  async function criarTarefaOficio(origemId: string, ordem: number, label: string) {
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    await supabase.from("processo_tarefas").insert({
      processo_id: processoId,
      origem_tipo: "kanban",
      origem_id: origemId,
      ordem,
      label,
      agendamento_data: amanha.toISOString().slice(0, 10),
      periodo: "manha",
    });
  }

  async function confirmarEntregaOcorreu(execucaoId: string) {
    setErro(null);
    setProcessandoConfirmacao(true);
    const hoje = new Date().toISOString().slice(0, 10);

    const { error } = await supabase
      .from("processo_execucoes")
      .update({ situacao: "entregue", data_entrega: hoje })
      .eq("id", execucaoId);
    if (error) {
      setProcessandoConfirmacao(false);
      setErro(error.message);
      return;
    }

    if (problemasMarcados.length > 0) {
      for (const valor of problemasMarcados) {
        const tagId = idDaTag(valor);
        if (tagId) await adicionarEventoSeNovo(tagId);
      }
      const origemId = await mudarEtapaCriacaoOficio();
      if (origemId) {
        let ordem = 1;
        for (const valor of problemasMarcados) {
          await criarTarefaOficio(origemId, ordem++, `Criar ofício de ${valor}`);
        }
      }
    }

    setProcessandoConfirmacao(false);
    fecharConfirmacao();
    router.refresh();
  }

  async function confirmarEntregaNaoOcorreu(execucaoId: string) {
    setErro(null);
    setProcessandoConfirmacao(true);

    const { error } = await supabase.from("processo_execucoes").update({ situacao: "atrasada" }).eq("id", execucaoId);
    if (error) {
      setProcessandoConfirmacao(false);
      setErro(error.message);
      return;
    }

    const idAtraso = idDaTag(EVENTO_ATRASO);
    if (idAtraso) await adicionarEventoSeNovo(idAtraso);
    const idFalta = idDaTag(EVENTO_FALTA);
    if (idFalta) await adicionarEventoSeNovo(idFalta);

    const origemId = await mudarEtapaCriacaoOficio();
    if (origemId) {
      await criarTarefaOficio(origemId, 1, "Criar ofício de notificação - atraso na entrega");
    }

    setProcessandoConfirmacao(false);
    fecharConfirmacao();
    router.refresh();
  }

  const proximoNumero = execucoes.length > 0 ? Math.max(...execucoes.map((e) => e.numero)) + 1 : 1;

  async function atualizarSituacao(execucaoId: string, situacao: string) {
    setErro(null);
    setCarregando(execucaoId);
    const { error } = await supabase.from("processo_execucoes").update({ situacao }).eq("id", execucaoId);
    setCarregando(null);
    if (error) {
      setErro(error.message);
      return;
    }
    router.refresh();
  }

  function abrirEdicao(e: Execucao) {
    setEditando(true);
    setEdicao({
      quantidade: formatarQuantidade(e.quantidade),
      data_prevista: e.data_prevista ?? "",
      periodo: e.periodo ?? "",
      data_entrega: e.data_entrega ?? "",
    });
  }

  async function salvarEdicao(execucaoId: string) {
    if (!edicao) return;
    setErro(null);
    setCarregando(execucaoId);
    const { error } = await supabase
      .from("processo_execucoes")
      .update({
        quantidade: paraNumero(edicao.quantidade),
        data_prevista: edicao.data_prevista || null,
        periodo: edicao.periodo || null,
        data_entrega: edicao.data_entrega || null,
      })
      .eq("id", execucaoId);
    setCarregando(null);
    if (error) {
      setErro(error.message);
      return;
    }
    setEditando(false);
    setEdicao(null);
    router.refresh();
  }

  async function remover(execucaoId: string) {
    setErro(null);
    setCarregando(execucaoId);
    const { error } = await supabase.from("processo_execucoes").delete().eq("id", execucaoId);
    setCarregando(null);
    if (error) {
      setErro(error.message);
      return;
    }
    setParcelaSelecionadaId(null);
    router.refresh();
  }

  async function adicionar() {
    if (!novaQuantidade || !itemSelecionado) return;
    setErro(null);
    setCarregando("novo");
    const { data: criada, error } = await supabase
      .from("processo_execucoes")
      .insert({
        processo_id: processoId,
        item_id: itemSelecionado.id,
        numero: proximoNumero,
        quantidade: paraNumero(novaQuantidade),
        data_prevista: novaData || null,
        periodo: novoPeriodo || null,
      })
      .select("id")
      .single();
    setCarregando(null);
    if (error) {
      setErro(error.message);
      return;
    }
    setNovo(false);
    setNovaQuantidade("");
    setNovaData("");
    setNovoPeriodo("");
    if (criada) setParcelaSelecionadaId(criada.id);
    router.refresh();
  }

  function abrirNovoLancamento() {
    setCriandoLancamento(true);
    setNovoLancTipo("parcial");
    setNovoLancData(hoje);
    setNovoLancNormal("");
    setNovoLancAvaria("");
    setNovoLancDesvio("");
    setErro(null);
  }

  // Cada lançamento total/parcial já nasce com os dois "slots" de NUP
  // (Entrega + Pagamento) — ambos 1-por-lançamento agora, já que uma parcela
  // pode ter várias entregas parciais. O número de cada um (vem do SEI) é
  // preenchido depois, em Dados principais.
  async function criarLancamento(execucaoId: string) {
    const normal = paraNumero(novoLancNormal);
    const avaria = paraNumero(novoLancAvaria);
    const desvio = paraNumero(novoLancDesvio);
    if (!novoLancData || normal + avaria + desvio <= 0) return;
    setErro(null);
    setSalvandoLancamento(true);
    const { data: lancamento, error } = await supabase
      .from("processo_entrega_lancamentos")
      .insert({
        execucao_id: execucaoId,
        tipo: novoLancTipo,
        quantidade_normal: normal,
        quantidade_avaria: avaria,
        quantidade_desvio: desvio,
        data_entrega: novoLancData,
      })
      .select("id")
      .single();
    if (error || !lancamento) {
      setSalvandoLancamento(false);
      setErro(error?.message ?? "Não deu pra salvar o lançamento.");
      return;
    }
    await supabase.from("processo_nups").insert([
      { processo_id: processoId, tipo: "entrega", execucao_id: execucaoId, lancamento_id: lancamento.id },
      { processo_id: processoId, tipo: "pagamento", execucao_id: execucaoId, lancamento_id: lancamento.id },
    ]);
    setSalvandoLancamento(false);
    setCriandoLancamento(false);
    router.refresh();
  }

  async function removerLancamento(lancamentoId: string) {
    setErro(null);
    setRemovendoLancamentoId(lancamentoId);
    const { error } = await supabase.from("processo_entrega_lancamentos").delete().eq("id", lancamentoId);
    setRemovendoLancamentoId(null);
    if (error) {
      setErro(error.message);
      return;
    }
    router.refresh();
  }

  function abrirLancamentoAvaria(lancamentoId: string) {
    setLancandoAvariaDeId(lancamentoId);
    setAvariaData("");
    setAvariaQuantidade("");
    setErro(null);
  }

  // Reposição de avaria não tem NUP próprio — é a mesma entrega/pagamento do
  // lançamento original, só corrigindo a quantidade que veio avariada.
  async function criarAvaria(execucaoId: string, lancamentoPaiId: string) {
    const quantidade = paraNumero(avariaQuantidade);
    if (!avariaData || quantidade <= 0) return;
    setErro(null);
    setSalvandoAvaria(true);
    const { error } = await supabase.from("processo_entrega_lancamentos").insert({
      execucao_id: execucaoId,
      tipo: "avaria",
      lancamento_pai_id: lancamentoPaiId,
      quantidade_normal: quantidade,
      data_limite: avariaData,
    });
    setSalvandoAvaria(false);
    if (error) {
      setErro(error.message);
      return;
    }
    setLancandoAvariaDeId(null);
    router.refresh();
  }

  return (
    <section>
      {erro && <p style={{ color: cor.urgente }}>{erro}</p>}

      {itens.length === 0 && !novoItem && (
        <p style={{ color: cor.textoTerciario, fontSize: 13 }}>Nenhum item cadastrado.</p>
      )}

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
        {itensOrdenados.map((i) => (
          <button
            key={i.id}
            onClick={() => selecionarItem(i.id)}
            style={{
              fontSize: 11.5,
              fontWeight: 600,
              padding: "5px 12px",
              borderRadius: 20,
              border: "none",
              color: itemSelecionadoId === i.id && !novoItem ? "#fff" : cor.textoSecundario,
              background: itemSelecionadoId === i.id && !novoItem ? cor.destaque : "rgba(96,93,93,.10)",
            }}
          >
            Item {i.numero} · {i.descricao.length > 28 ? `${i.descricao.slice(0, 28)}…` : i.descricao}
          </button>
        ))}
        <button
          onClick={abrirNovoItem}
          style={{
            fontSize: 11.5,
            fontWeight: 600,
            padding: "5px 12px",
            borderRadius: 20,
            border: `1.5px dashed ${cor.borda}`,
            color: cor.textoTerciario,
            background: novoItem ? cor.destaqueFundo : "transparent",
          }}
        >
          + Novo item
        </button>
        <label
          style={{
            fontSize: 11.5,
            fontWeight: 600,
            padding: "5px 12px",
            borderRadius: 20,
            border: `1.5px dashed ${cor.borda}`,
            color: cor.textoTerciario,
            background: "transparent",
            cursor: extraindoAnexo ? "default" : "pointer",
            opacity: extraindoAnexo ? 0.6 : 1,
          }}
        >
          {extraindoAnexo ? "Lendo anexo..." : "+ Itens por anexo (PDF/foto)"}
          <input
            type="file"
            accept="application/pdf,image/png,image/jpeg,image/webp"
            disabled={extraindoAnexo}
            onChange={(e) => {
              const arquivo = e.target.files?.[0];
              if (arquivo) processarAnexo(arquivo);
              e.target.value = "";
            }}
            style={{ display: "none" }}
          />
        </label>
      </div>
      {erroAnexo && <p style={{ color: cor.urgente, fontSize: 12, marginTop: -4 }}>{erroAnexo}</p>}

      {(novoItem || editandoItem) && (
        <div
          style={{
            border: `1px solid ${cor.borda}`,
            borderRadius: 12,
            padding: 10,
            marginBottom: 12,
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            alignItems: "flex-end",
          }}
        >
          <Campo label="Descrição">
            <input
              value={itemForm.descricao}
              onChange={(ev) => setItemForm({ ...itemForm, descricao: ev.target.value })}
              style={{ padding: 4, width: 220 }}
              placeholder="Ex.: INSULINA HUMANA REGULAR 100 U/ML"
            />
          </Campo>
          <Campo label="CATMAT">
            <input
              value={itemForm.catmat}
              onChange={(ev) => setItemForm({ ...itemForm, catmat: ev.target.value })}
              style={{ padding: 4, width: 90 }}
            />
          </Campo>
          <Campo label="Unidade">
            <input
              value={itemForm.unidade_medida}
              onChange={(ev) => setItemForm({ ...itemForm, unidade_medida: ev.target.value })}
              style={{ padding: 4, width: 100 }}
              placeholder="Ex.: Tubete 3 ml"
            />
          </Campo>
          <CampoQuantidade
            valor={itemForm.quantidade}
            onChange={(v) => setItemForm({ ...itemForm, quantidade: v })}
          />
          <Campo label="Valor unitário (R$)">
            <input
              value={itemForm.valor_unitario}
              onChange={(ev) => setItemForm({ ...itemForm, valor_unitario: ev.target.value })}
              style={{ padding: 4, width: 90 }}
              placeholder="0,00"
            />
          </Campo>
          <button
            onClick={novoItem ? salvarNovoItem : salvarEdicaoItem}
            disabled={salvandoItem || !itemForm.descricao.trim()}
            style={{ fontSize: 11 }}
          >
            {salvandoItem ? "..." : "Salvar"}
          </button>
          <button
            onClick={() => {
              setNovoItem(false);
              setEditandoItem(false);
            }}
            disabled={salvandoItem}
            style={{ fontSize: 11 }}
          >
            Cancelar
          </button>
        </div>
      )}

      {itemSelecionado && !novoItem && !editandoItem && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
            fontSize: 11.5,
            color: cor.textoTerciario,
            marginBottom: 10,
          }}
        >
          {itemSelecionado.catmat && <span>CATMAT {itemSelecionado.catmat}</span>}
          {itemSelecionado.unidade_medida && <span>{itemSelecionado.unidade_medida}</span>}
          {itemSelecionado.quantidade != null && <span>Qtd. contratada: {formatarQuantidade(itemSelecionado.quantidade)}</span>}
          {itemSelecionado.valor_unitario != null && <span>Unit.: {formatarMoeda(itemSelecionado.valor_unitario)}</span>}
          <button onClick={abrirEdicaoItem} style={{ fontSize: 10.5 }}>
            editar item
          </button>
          <button onClick={removerItem} disabled={salvandoItem} style={{ fontSize: 10.5 }}>
            remover item
          </button>
        </div>
      )}

      {itemSelecionado && execucoes.length > 0 && (() => {
        // Barra de progresso do item: proporção da quantidade total de
        // parcelas em cada situação (pendente/em trânsito/entregue/atrasada),
        // mesmo padrão de "barra de 4 cores" visto no GEFISC — dá pra ver o
        // andamento do item inteiro num relance, sem abrir parcela por parcela.
        const ORDEM_SITUACAO = ["entregue", "em_transito", "pendente", "atrasada"];
        const totalQuantidade = execucoes.reduce((soma, e) => soma + Number(e.quantidade), 0);
        if (totalQuantidade <= 0) return null;
        const segmentos = ORDEM_SITUACAO.map((situacao) => ({
          situacao,
          quantidade: execucoes
            .filter((e) => e.situacao === situacao)
            .reduce((soma, e) => soma + Number(e.quantidade), 0),
        })).filter((s) => s.quantidade > 0);
        return (
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", height: 8, borderRadius: 5, overflow: "hidden", background: "rgba(96,93,93,.10)" }}>
              {segmentos.map((s) => (
                <div
                  key={s.situacao}
                  title={`${s.situacao}: ${formatarQuantidade(s.quantidade)} (${Math.round((s.quantidade / totalQuantidade) * 100)}%)`}
                  style={{
                    width: `${(s.quantidade / totalQuantidade) * 100}%`,
                    background: SITUACAO_COR[s.situacao]?.fg ?? cor.textoTerciario,
                  }}
                />
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 4 }}>
              {segmentos.map((s) => (
                <span key={s.situacao} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: cor.textoTerciario }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: SITUACAO_COR[s.situacao]?.fg, flex: "none" }} />
                  {s.situacao} · {formatarQuantidade(s.quantidade)}
                </span>
              ))}
            </div>
          </div>
        );
      })()}

      {itemSelecionado && (
        <>
          {execucoes.length === 0 && !novo && (
            <p style={{ color: cor.textoTerciario, fontSize: 13 }}>Nenhuma entrega cadastrada neste item.</p>
          )}

          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
            {execucoesOrdenadas.map((e) => {
              const selecionadaAgora = parcelaSelecionadaId === e.id && !novo;
              const diasAtraso = !dataEntregaEfetiva(e) ? diasEmAtrasoAgora(e.data_prevista, hoje) : null;
              return (
                <button
                  key={e.id}
                  onClick={() => {
                    setParcelaSelecionadaId(e.id);
                    setNovo(false);
                    setEditando(false);
                    fecharConfirmacao();
                  }}
                  style={{
                    fontSize: 11.5,
                    fontWeight: 600,
                    padding: "5px 12px",
                    borderRadius: 20,
                    border: "none",
                    color: selecionadaAgora ? "#fff" : diasAtraso ? cor.urgente : cor.textoSecundario,
                    background: selecionadaAgora ? (diasAtraso ? cor.urgente : cor.destaque) : diasAtraso ? cor.urgenteFundo : "rgba(96,93,93,.10)",
                  }}
                >
                  {ordinal(e.numero)}
                  {(e.processo_entrega_lancamentos?.length ?? 0) > 1 ? " · Parcial" : ""}
                  {diasAtraso ? ` · ${diasAtraso}d atraso` : ""}
                </button>
              );
            })}
            <button
              onClick={() => {
                setNovo(true);
                setParcelaSelecionadaId(null);
              }}
              style={{
                fontSize: 11.5,
                fontWeight: 600,
                padding: "5px 12px",
                borderRadius: 20,
                border: `1.5px dashed ${cor.borda}`,
                color: cor.textoTerciario,
                background: novo ? cor.destaqueFundo : "transparent",
              }}
            >
              + Criar
            </button>
          </div>

          {novo && (
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start", flexWrap: "wrap" }}>
              <span style={{ fontSize: 12, color: cor.textoTerciario, paddingTop: 6 }}>{ordinal(proximoNumero)}</span>
              <CampoQuantidade valor={novaQuantidade} onChange={setNovaQuantidade} />
              <input type="date" value={novaData} onChange={(e) => setNovaData(e.target.value)} style={{ padding: 6 }} />
              <SeletorPeriodo valor={novoPeriodo} onChange={setNovoPeriodo} />
              <button onClick={adicionar} disabled={carregando === "novo" || !novaQuantidade}>
                Salvar
              </button>
              <button onClick={() => setNovo(false)} disabled={carregando === "novo"}>
                Cancelar
              </button>
            </div>
          )}

          {selecionada && !novo && (() => {
            const e = selecionada;
            const dataEntregue = dataEntregaEfetiva(e);
            const atraso = textoAtraso(e.data_prevista, dataEntregue, hoje);
            const todosLancamentos = e.processo_entrega_lancamentos ?? [];
            // Lançamentos de avaria não aparecem na lista principal — ficam
            // aninhados embaixo do lançamento total/parcial que corrigem.
            const lancamentos = todosLancamentos
              .filter((l) => l.tipo !== "avaria")
              .sort((a, b) => (a.data_entrega ?? "").localeCompare(b.data_entrega ?? ""));
            const avariasDe = (paiId: string) =>
              todosLancamentos.filter((l) => l.lancamento_pai_id === paiId);
            const faltam = falta(e);
            const lancado = totalLancado(todosLancamentos);
            return (
              <div style={{ border: `1px solid ${cor.borda}`, borderRadius: 12, padding: 10 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))", gap: 10 }}>
                  {editando && edicao ? (
                    <>
                      <CampoQuantidade
                        valor={edicao.quantidade}
                        onChange={(v) => setEdicao({ ...edicao, quantidade: v })}
                      />
                      <Campo label="Data prevista">
                        <input
                          type="date"
                          value={edicao.data_prevista}
                          onChange={(ev) => setEdicao({ ...edicao, data_prevista: ev.target.value })}
                          style={{ padding: 4 }}
                        />
                      </Campo>
                      <Campo label="Período">
                        <SeletorPeriodo valor={edicao.periodo} onChange={(p) => setEdicao({ ...edicao, periodo: p })} />
                      </Campo>
                      <Campo label="Data entregue">
                        <input
                          type="date"
                          value={edicao.data_entrega}
                          onChange={(ev) => setEdicao({ ...edicao, data_entrega: ev.target.value })}
                          style={{ padding: 4 }}
                        />
                      </Campo>
                    </>
                  ) : (
                    <>
                      <Campo label="Quantidade">{formatarQuantidade(e.quantidade)}</Campo>
                      <Campo label="Data prevista">
                        {formatarData(e.data_prevista)}
                        {e.periodo ? ` · ${e.periodo === "manha" ? "Manhã" : "Tarde"}` : ""}
                      </Campo>
                      <Campo label="Data entregue">{formatarData(dataEntregue)}</Campo>
                    </>
                  )}
                  <Campo label="Total lançado">{formatarQuantidade(lancado)}</Campo>
                  <Campo label="Falta">
                    <span style={{ color: faltam < 0 ? cor.urgente : undefined, fontWeight: faltam < 0 ? 600 : 400 }}>
                      {faltam < 0 ? `excedeu ${formatarQuantidade(-faltam)}` : formatarQuantidade(faltam)}
                    </span>
                  </Campo>
                  <Campo label="Prazo">
                    <span style={{ color: atraso.destaque === "urgente" ? cor.urgente : atraso.destaque === "positivo" ? cor.positivo : undefined, fontWeight: atraso.destaque ? 600 : 400 }}>
                      {atraso.texto}
                    </span>
                  </Campo>
                  <Campo label="Situação">
                    <select
                      value={e.situacao}
                      onChange={(ev) => atualizarSituacao(e.id, ev.target.value)}
                      disabled={carregando === e.id}
                      style={{
                        padding: "3px 7px",
                        borderRadius: 20,
                        border: "none",
                        fontWeight: 600,
                        fontSize: 10.5,
                        color: SITUACAO_COR[e.situacao]?.fg,
                        background: SITUACAO_COR[e.situacao]?.bg,
                      }}
                    >
                      {SITUACOES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </Campo>
                </div>

                <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 10 }}>
                  {editando ? (
                    <>
                      <button onClick={() => salvarEdicao(e.id)} disabled={carregando === e.id} style={{ fontSize: 11 }}>
                        Salvar
                      </button>
                      <button
                        onClick={() => {
                          setEditando(false);
                          setEdicao(null);
                        }}
                        disabled={carregando === e.id}
                        style={{ fontSize: 11 }}
                      >
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => abrirEdicao(e)} disabled={carregando === e.id} style={{ fontSize: 11 }}>
                        editar
                      </button>
                      <button onClick={() => remover(e.id)} disabled={carregando === e.id} style={{ fontSize: 11 }}>
                        remover
                      </button>
                      {confirmandoId !== e.id && (
                        <button
                          onClick={() => { setConfirmandoId(e.id); setEtapaConfirmacao("pergunta"); setProblemasMarcados([]); }}
                          style={{ fontSize: 11 }}
                        >
                          confirmar entrega
                        </button>
                      )}
                    </>
                  )}
                </div>

                {confirmandoId === e.id && (
                  <div
                    style={{
                      marginTop: 10,
                      padding: 10,
                      borderRadius: 10,
                      background: cor.fundo,
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                      alignItems: "center",
                    }}
                  >
                    {etapaConfirmacao === "pergunta" && (
                      <>
                        <span style={{ fontSize: 12.5, fontWeight: 600 }}>A entrega ocorreu?</span>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            onClick={() => setEtapaConfirmacao("problemas")}
                            disabled={processandoConfirmacao}
                            style={{ fontSize: 11.5 }}
                          >
                            Sim
                          </button>
                          <button
                            onClick={() => confirmarEntregaNaoOcorreu(e.id)}
                            disabled={processandoConfirmacao}
                            style={{ fontSize: 11.5 }}
                          >
                            {processandoConfirmacao ? "..." : "Não"}
                          </button>
                          <button onClick={fecharConfirmacao} disabled={processandoConfirmacao} style={{ fontSize: 11.5 }}>
                            Cancelar
                          </button>
                        </div>
                      </>
                    )}
                    {etapaConfirmacao === "problemas" && (
                      <>
                        <span style={{ fontSize: 12.5, fontWeight: 600 }}>
                          Ocorreu algum desses problemas na entrega?
                        </span>
                        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
                          {PROBLEMAS_ENTREGA.map((valor) => (
                            <label key={valor} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
                              <input
                                type="checkbox"
                                checked={problemasMarcados.includes(valor)}
                                onChange={() => alternarProblema(valor)}
                              />
                              {valor}
                            </label>
                          ))}
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            onClick={() => confirmarEntregaOcorreu(e.id)}
                            disabled={processandoConfirmacao}
                            style={{ fontSize: 11.5 }}
                          >
                            {processandoConfirmacao ? "..." : "Confirmar"}
                          </button>
                          <button onClick={fecharConfirmacao} disabled={processandoConfirmacao} style={{ fontSize: 11.5 }}>
                            Cancelar
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}

                <div style={{ marginTop: 14, paddingTop: 10, borderTop: `1px solid ${cor.borda}` }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: cor.textoTerciario, textTransform: "uppercase", letterSpacing: 0.6 }}>
                    Entregas lançadas
                  </span>

                  {lancamentos.length === 0 && (
                    <p style={{ fontSize: 12, color: cor.textoTerciario, margin: "6px 0 0" }}>
                      Nenhuma entrega lançada ainda.
                    </p>
                  )}

                  {lancamentos.map((l) => {
                    const nupEntrega = nupPorTipo(l.processo_nups, "entrega");
                    const nupPagamento = nupPorTipo(l.processo_nups, "pagamento");
                    const avarias = avariasDe(l.id);
                    return (
                      <div key={l.id} style={{ borderBottom: `1px solid ${cor.borda}`, padding: "8px 0" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", fontSize: 12 }}>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 600,
                              padding: "2px 7px",
                              borderRadius: 10,
                              color: cor.destaque,
                              background: cor.destaqueFundo,
                            }}
                          >
                            {l.tipo === "total" ? "Total" : "Parcial"}
                          </span>
                          <span style={{ color: cor.textoTerciario, minWidth: 70 }}>{formatarData(l.data_entrega)}</span>
                          <span>Normal: <strong>{formatarQuantidade(l.quantidade_normal)}</strong></span>
                          {l.quantidade_avaria > 0 && (
                            <span style={{ color: cor.urgente }}>Avaria: <strong>{formatarQuantidade(l.quantidade_avaria)}</strong></span>
                          )}
                          {l.quantidade_desvio > 0 && (
                            <span style={{ color: cor.urgente }}>Desvio: <strong>{formatarQuantidade(l.quantidade_desvio)}</strong></span>
                          )}
                          <button
                            onClick={() => removerLancamento(l.id)}
                            disabled={removendoLancamentoId === l.id}
                            style={{ fontSize: 10.5, marginLeft: "auto" }}
                          >
                            remover
                          </button>
                        </div>
                        {/* NUPs são só leitura aqui — ficam editáveis em Dados principais,
                            junto da visão por parcela. */}
                        <div style={{ display: "flex", gap: 14, marginTop: 4, fontSize: 11, color: cor.textoTerciario }}>
                          <span>NUP entrega: {nupEntrega?.nup || "não informado"}</span>
                          <span>NUP pagamento: {nupPagamento?.nup || "não informado"}</span>
                        </div>

                        {avarias.length > 0 && (
                          <div style={{ marginTop: 6, marginLeft: 22, display: "flex", flexDirection: "column", gap: 4 }}>
                            {avarias.map((a) => (
                              <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 11.5 }}>
                                <span style={{ color: cor.urgente, fontWeight: 600 }}>Avaria</span>
                                <span style={{ color: cor.textoTerciario }}>Prazo: {formatarData(a.data_limite)}</span>
                                <span>Qtd.: <strong>{formatarQuantidade(a.quantidade_normal)}</strong></span>
                                <button
                                  onClick={() => removerLancamento(a.id)}
                                  disabled={removendoLancamentoId === a.id}
                                  style={{ fontSize: 10 }}
                                >
                                  remover
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {lancandoAvariaDeId === l.id ? (
                          <div style={{ display: "flex", gap: 10, alignItems: "flex-end", marginTop: 8, marginLeft: 22, flexWrap: "wrap" }}>
                            <Campo label="Prazo">
                              <input
                                type="date"
                                value={avariaData}
                                onChange={(ev) => setAvariaData(ev.target.value)}
                                style={{ padding: 4 }}
                              />
                            </Campo>
                            <Campo label="Quantidade">
                              <CampoMascarado
                                valor={avariaQuantidade}
                                formatar={formatarNumeroBR}
                                onChange={setAvariaQuantidade}
                                style={{ width: 90, padding: 4, textAlign: "center" }}
                              />
                            </Campo>
                            <button
                              onClick={() => criarAvaria(e.id, l.id)}
                              disabled={salvandoAvaria || !avariaData || paraNumero(avariaQuantidade) <= 0}
                              style={{ fontSize: 10.5 }}
                            >
                              {salvandoAvaria ? "..." : "Salvar"}
                            </button>
                            <button onClick={() => setLancandoAvariaDeId(null)} disabled={salvandoAvaria} style={{ fontSize: 10.5 }}>
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          l.quantidade_avaria > 0 && (
                            <button
                              onClick={() => abrirLancamentoAvaria(l.id)}
                              style={{ fontSize: 10.5, marginTop: 6, marginLeft: 22 }}
                            >
                              + Lançar reposição de avaria
                            </button>
                          )
                        )}
                      </div>
                    );
                  })}

                  {criandoLancamento ? (
                    <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap", marginTop: 10 }}>
                      <Campo label="Tipo">
                        <div style={{ display: "flex", gap: 4 }}>
                          {(["parcial", "total"] as const).map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setNovoLancTipo(t)}
                              style={{
                                fontSize: 10.5,
                                fontWeight: 600,
                                padding: "4px 9px",
                                borderRadius: 7,
                                border: "none",
                                color: novoLancTipo === t ? cor.destaque : cor.textoTerciario,
                                background: novoLancTipo === t ? cor.destaqueFundo : "rgba(96,93,93,.10)",
                              }}
                            >
                              {t === "total" ? "Total" : "Parcial"}
                            </button>
                          ))}
                        </div>
                      </Campo>
                      <Campo label="Data">
                        <input
                          type="date"
                          value={novoLancData}
                          onChange={(ev) => setNovoLancData(ev.target.value)}
                          style={{ padding: 4 }}
                        />
                      </Campo>
                      <CampoQuantidade valor={novoLancNormal} onChange={setNovoLancNormal} />
                      <Campo label="Avaria">
                        <CampoMascarado
                          valor={novoLancAvaria}
                          formatar={formatarNumeroBR}
                          onChange={setNovoLancAvaria}
                          style={{ width: 90, padding: 4, textAlign: "center" }}
                        />
                      </Campo>
                      <Campo label="Desvio">
                        <CampoMascarado
                          valor={novoLancDesvio}
                          formatar={formatarNumeroBR}
                          onChange={setNovoLancDesvio}
                          style={{ width: 90, padding: 4, textAlign: "center" }}
                        />
                      </Campo>
                      <button
                        onClick={() => criarLancamento(e.id)}
                        disabled={
                          salvandoLancamento ||
                          !novoLancData ||
                          paraNumero(novoLancNormal) + paraNumero(novoLancAvaria) + paraNumero(novoLancDesvio) <= 0
                        }
                        style={{ fontSize: 11 }}
                      >
                        {salvandoLancamento ? "..." : "Salvar"}
                      </button>
                      <button onClick={() => setCriandoLancamento(false)} disabled={salvandoLancamento} style={{ fontSize: 11 }}>
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button onClick={abrirNovoLancamento} style={{ fontSize: 11, marginTop: 10 }}>
                      + Lançar entrega
                    </button>
                  )}
                </div>
              </div>
            );
          })()}
        </>
      )}
    </section>
  );
}
