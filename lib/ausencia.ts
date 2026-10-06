// Uma pessoa está "ausente agora" quando hoje cai dentro do período
// cadastrado — início é obrigatório pra considerar ausência, fim em aberto
// (null) significa "ainda sem data de volta definida", ou seja, ausente
// indefinidamente a partir do início.
export function estaAusente(
  ausenciaInicio: string | null | undefined,
  ausenciaFim: string | null | undefined,
  hoje = new Date().toISOString().slice(0, 10),
): boolean {
  if (!ausenciaInicio) return false;
  if (ausenciaInicio > hoje) return false;
  if (ausenciaFim && ausenciaFim < hoje) return false;
  return true;
}

function formatarDataBR(data: string) {
  return new Date(`${data}T00:00:00`).toLocaleDateString("pt-BR");
}

// Texto curto do período, pra mostrar junto da tag "Ausente".
export function periodoAusencia(ausenciaInicio: string, ausenciaFim: string | null | undefined): string {
  return ausenciaFim
    ? `${formatarDataBR(ausenciaInicio)} a ${formatarDataBR(ausenciaFim)}`
    : `desde ${formatarDataBR(ausenciaInicio)}`;
}
