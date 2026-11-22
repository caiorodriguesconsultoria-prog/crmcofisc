// Status de entrega por parcela e por contrato, pra colorir os cards de
// Contratos (pedido do Caio). As funções de data/quantidade replicam as
// mesmas regras já usadas em app/processos/[id]/cronograma.tsx (não
// importadas de lá porque cronograma.tsx é "use client" e esse módulo
// precisa rodar também em componente de servidor) — qualquer mudança nessa
// lógica deve ser espelhada nos dois lugares.

export type StatusParcela = "verde" | "amarelo" | "vermelho" | "neutro";

export type LancamentoStatus = {
  id: string;
  tipo: string;
  lancamento_pai_id: string | null;
  quantidade_normal: number;
  quantidade_avaria: number;
  quantidade_desvio: number;
  data_entrega: string | null;
};

export type ParcelaStatus = {
  quantidade: number;
  data_prevista: string | null;
  lancamentos: LancamentoStatus[];
};

const DIAS_ANTECEDENCIA_AMARELO = 5;

function diferencaDias(dataPrevista: string | null, dataEntrega: string | null): number | null {
  if (!dataPrevista || !dataEntrega) return null;
  const diffMs = new Date(`${dataEntrega}T00:00:00`).getTime() - new Date(`${dataPrevista}T00:00:00`).getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

function diasEmAtrasoAgora(dataPrevista: string | null, hoje: string): number | null {
  if (!dataPrevista) return null;
  const diffMs = new Date(`${hoje}T00:00:00`).getTime() - new Date(`${dataPrevista}T00:00:00`).getTime();
  const dias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return dias > 0 ? dias : null;
}

function diasAteOPrazo(dataPrevista: string | null, hoje: string): number | null {
  if (!dataPrevista) return null;
  const diffMs = new Date(`${dataPrevista}T00:00:00`).getTime() - new Date(`${hoje}T00:00:00`).getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

function totalLancado(lancamentos: LancamentoStatus[]): number {
  return lancamentos
    .filter((l) => l.tipo !== "avaria" && l.tipo !== "desvio")
    .reduce((soma, l) => soma + Number(l.quantidade_normal) + Number(l.quantidade_avaria) + Number(l.quantidade_desvio), 0);
}

function dataEntregaEfetiva(parcela: ParcelaStatus): string | null {
  const datas = parcela.lancamentos
    .filter((l) => l.tipo !== "avaria" && l.tipo !== "desvio" && l.data_entrega)
    .map((l) => l.data_entrega as string)
    .sort();
  return datas[0] ?? null;
}

// Avaria/desvio "pendente" = quantidade > 0 registrada num lançamento que
// ainda não tem um lançamento filho (reposição) de mesmo tipo resolvendo.
function temAvariaOuDesvioPendente(parcela: ParcelaStatus): boolean {
  return parcela.lancamentos.some((l) => {
    if (l.tipo === "avaria" || l.tipo === "desvio") return false;
    const precisaAvaria = l.quantidade_avaria > 0;
    const precisaDesvio = l.quantidade_desvio > 0;
    if (!precisaAvaria && !precisaDesvio) return false;
    const reposicoes = parcela.lancamentos.filter((r) => r.lancamento_pai_id === l.id);
    const avariaResolvida = !precisaAvaria || reposicoes.some((r) => r.tipo === "avaria");
    const desvioResolvido = !precisaDesvio || reposicoes.some((r) => r.tipo === "desvio");
    return !(avariaResolvida && desvioResolvido);
  });
}

// Pedido do Caio: "se foi entregue, fica verde; 5 dias antes da entrega da
// parcela, amarelo; entrega em atraso, vermelho; avaria/desvio sem resolver,
// amarelo até resolver". Avaria/desvio pendente manda mais que o resto —
// uma parcela entregue no prazo mas com desvio ainda não resolvido fica
// amarela, não verde.
export function statusParcela(parcela: ParcelaStatus, hoje: string): StatusParcela {
  if (temAvariaOuDesvioPendente(parcela)) return "amarelo";

  const dataEntrega = dataEntregaEfetiva(parcela);
  const completa = totalLancado(parcela.lancamentos) >= parcela.quantidade;

  if (dataEntrega && completa) {
    const diff = diferencaDias(parcela.data_prevista, dataEntrega);
    return diff !== null && diff > 0 ? "vermelho" : "verde";
  }

  const atrasoAgora = diasEmAtrasoAgora(parcela.data_prevista, hoje);
  if (atrasoAgora !== null) return "vermelho";

  const faltam = diasAteOPrazo(parcela.data_prevista, hoje);
  if (faltam !== null && faltam >= 0 && faltam <= DIAS_ANTECEDENCIA_AMARELO) return "amarelo";

  return "neutro";
}

const ORDEM_URGENCIA: StatusParcela[] = ["vermelho", "amarelo", "verde"];

// Status do contrato = as cores distintas (ignorando "neutro") entre todas
// as parcelas, na ordem vermelho→amarelo→verde — pra montar o degradê.
// Uma cor só = sólido; nenhuma = sem destaque (contrato "neutro").
export function statusContrato(parcelas: ParcelaStatus[], hoje: string): StatusParcela[] {
  const presentes = new Set(parcelas.map((p) => statusParcela(p, hoje)));
  return ORDEM_URGENCIA.filter((s) => presentes.has(s));
}

// Cores importadas de lib/theme.ts (não reexportadas daqui) — quem usa isso
// passa a cor de cada tom, pra não duplicar a paleta em dois lugares. Isso
// só monta a string do degradê a partir das cores que o chamador já tem.
export function gradienteOuSolido(statusPresentes: StatusParcela[], cores: Record<Exclude<StatusParcela, "neutro">, string>): string | null {
  const lista = statusPresentes.filter((s): s is Exclude<StatusParcela, "neutro"> => s !== "neutro");
  if (lista.length === 0) return null;
  if (lista.length === 1) return cores[lista[0]];
  return `linear-gradient(90deg, ${lista.map((s) => cores[s]).join(", ")})`;
}
