import { siglaUf } from "@/lib/estados-br";

// Atraso, % de transcurso e quantidade faltante de Dados de entrega não
// ficam mais salvos em `processo_entregas` — são sempre calculados na hora,
// cruzando com a Pauta de Distribuição. Esse módulo é a lógica compartilhada
// entre a tela do contrato, o PDF do relatório e o KPI agregado de /dados,
// pra não haver 3 implementações divergentes do mesmo cálculo.

export type EntregaDerivada = {
  id: string;
  local_entrega: string | null;
  quantidade: number | null;
  data_fabricacao: string | null;
  data_validade: string | null;
  data_entrega: string | null;
};

export type PautaDerivada = {
  uf: string;
  quantidade: number;
  data_entrega: string | null;
};

function diasEntre(data1: string, data2: string): number {
  const ms = new Date(`${data1}T00:00:00`).getTime() - new Date(`${data2}T00:00:00`).getTime();
  return Math.round(ms / 86_400_000);
}

// % de transcurso de validade na data da entrega = quanto do prazo de
// validade (fabricação → validade) já tinha passado quando a entrega
// aconteceu. Fórmula confirmada pelo Caio: (entrega - fabricação) /
// (validade - fabricação), em percentual.
export function calcularTranscurso(
  fabricacao: string | null,
  validade: string | null,
  entrega: string | null,
): number | null {
  if (!fabricacao || !validade || !entrega) return null;
  const denominador = diasEntre(validade, fabricacao);
  if (denominador === 0) return null;
  return (diasEntre(entrega, fabricacao) / denominador) * 100;
}

// Cruza cada entrega com a Pauta de Distribuição pela UF (normalizada —
// documentos reais ora trazem "Acre", ora "AC") pra calcular:
// - atraso: data de entrega real vs. data prevista da pauta, pareando em
//   ordem (a 1ª entrega daquela UF compara com a 1ª linha de pauta daquela
//   UF ainda não usada, a 2ª com a 2ª etc.) — mesma convenção do Cronograma
//   (nunca negativo: entrega antecipada ou no prazo mostra 0).
// - faltante: quanto ainda falta entregar daquela UF (total da pauta menos
//   total já entregue, somando todas as entregas da UF, não só até essa
//   linha).
export function calcularDerivadosEntregas(entregas: EntregaDerivada[], pauta: PautaDerivada[]) {
  const pautaPorUf = new Map<string, PautaDerivada[]>();
  for (const p of pauta) {
    const chave = siglaUf(p.uf);
    const lista = pautaPorUf.get(chave) ?? [];
    lista.push(p);
    pautaPorUf.set(chave, lista);
  }
  for (const lista of pautaPorUf.values()) {
    lista.sort((a, b) => (a.data_entrega ?? "9999-99-99").localeCompare(b.data_entrega ?? "9999-99-99"));
  }

  const entregasOrdenadas = [...entregas].sort((a, b) => (a.data_entrega ?? "").localeCompare(b.data_entrega ?? ""));
  const usadoPorUf = new Map<string, number>();
  const atrasoPorId = new Map<string, number | null>();
  for (const e of entregasOrdenadas) {
    if (!e.local_entrega || !e.data_entrega) {
      atrasoPorId.set(e.id, null);
      continue;
    }
    const chave = siglaUf(e.local_entrega);
    const lista = pautaPorUf.get(chave) ?? [];
    const idx = usadoPorUf.get(chave) ?? 0;
    usadoPorUf.set(chave, idx + 1);
    const prevista = lista[idx]?.data_entrega ?? null;
    atrasoPorId.set(e.id, prevista ? Math.max(0, diasEntre(e.data_entrega, prevista)) : null);
  }

  const totalPautaPorUf = new Map<string, number>();
  for (const [chave, lista] of pautaPorUf) {
    totalPautaPorUf.set(chave, lista.reduce((soma, p) => soma + Number(p.quantidade), 0));
  }
  const totalEntreguePorUf = new Map<string, number>();
  for (const e of entregas) {
    if (!e.local_entrega) continue;
    const chave = siglaUf(e.local_entrega);
    totalEntreguePorUf.set(chave, (totalEntreguePorUf.get(chave) ?? 0) + (e.quantidade ?? 0));
  }
  const faltantePorId = new Map<string, number | null>();
  for (const e of entregas) {
    const chave = e.local_entrega ? siglaUf(e.local_entrega) : null;
    if (!chave || !totalPautaPorUf.has(chave)) {
      faltantePorId.set(e.id, null);
      continue;
    }
    faltantePorId.set(e.id, (totalPautaPorUf.get(chave) ?? 0) - (totalEntreguePorUf.get(chave) ?? 0));
  }

  return { atrasoPorId, faltantePorId };
}
