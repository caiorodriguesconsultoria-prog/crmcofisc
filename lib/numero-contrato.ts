// Alguns contratos têm o número de um documento SEI digitado junto do
// número do contrato no Quadro Resumitivo, tipo "255/2026 (0057340889)" —
// útil ali, mas não deve poluir os lugares que só mostram o número do
// contrato em si (título da página, listas, Agenda, Google Calendar/Tasks).
export function numeroContratoSemSei(numero: string): string {
  return numero.replace(/\s*\([^)]*\)\s*$/, "").trim();
}
