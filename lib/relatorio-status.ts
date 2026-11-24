// Relatório "desatualizado" quando nunca foi marcado como atualizado ou
// quando a última marcação já passou do limite de dias — regra única,
// usada em Contratos (app/processos/page.tsx), no Assistente de IA
// (app/api/assistente/route.ts) e no Painel (CRM Premium, Etapa 3). Antes
// duplicada em dois lugares; centralizada aqui pra não divergir.
export const LIMITE_DIAS_RELATORIO = 10;

export function relatorioDesatualizado(relatorioAtualizadoEm: string | null, agora = Date.now()): boolean {
  if (!relatorioAtualizadoEm) return true;
  const dias = (agora - new Date(relatorioAtualizadoEm).getTime()) / (1000 * 60 * 60 * 24);
  return dias > LIMITE_DIAS_RELATORIO;
}
