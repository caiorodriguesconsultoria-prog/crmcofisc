// Documentos reais ora trazem a UF por extenso ("Acre"), ora pela sigla
// ("AC") — pra cruzar Dados de entrega com Pauta de distribuição (que usa
// sigla, via dropdown) é preciso normalizar os dois lados pro mesmo valor.
const ESTADOS_BR: { sigla: string; nome: string }[] = [
  { sigla: "AC", nome: "Acre" },
  { sigla: "AL", nome: "Alagoas" },
  { sigla: "AP", nome: "Amapá" },
  { sigla: "AM", nome: "Amazonas" },
  { sigla: "BA", nome: "Bahia" },
  { sigla: "CE", nome: "Ceará" },
  { sigla: "DF", nome: "Distrito Federal" },
  { sigla: "ES", nome: "Espírito Santo" },
  { sigla: "GO", nome: "Goiás" },
  { sigla: "MA", nome: "Maranhão" },
  { sigla: "MT", nome: "Mato Grosso" },
  { sigla: "MS", nome: "Mato Grosso do Sul" },
  { sigla: "MG", nome: "Minas Gerais" },
  { sigla: "PA", nome: "Pará" },
  { sigla: "PB", nome: "Paraíba" },
  { sigla: "PR", nome: "Paraná" },
  { sigla: "PE", nome: "Pernambuco" },
  { sigla: "PI", nome: "Piauí" },
  { sigla: "RJ", nome: "Rio de Janeiro" },
  { sigla: "RN", nome: "Rio Grande do Norte" },
  { sigla: "RS", nome: "Rio Grande do Sul" },
  { sigla: "RO", nome: "Rondônia" },
  { sigla: "RR", nome: "Roraima" },
  { sigla: "SC", nome: "Santa Catarina" },
  { sigla: "SP", nome: "São Paulo" },
  { sigla: "SE", nome: "Sergipe" },
  { sigla: "TO", nome: "Tocantins" },
];

function normalizarTexto(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
}

// Devolve a sigla de 2 letras (ou "Almoxarifado MS" verbatim) a partir de
// uma sigla ou nome por extenso, em qualquer caixa/acentuação. Se não
// reconhecer, devolve o texto original aparado — nunca derruba a tela por
// um valor fora do padrão.
export function siglaUf(valor: string): string {
  const v = normalizarTexto(valor);
  if (v === "almoxarifado ms") return "Almoxarifado MS";
  const porSigla = ESTADOS_BR.find((e) => e.sigla.toLowerCase() === v);
  if (porSigla) return porSigla.sigla;
  const porNome = ESTADOS_BR.find((e) => normalizarTexto(e.nome) === v);
  if (porNome) return porNome.sigla;
  return valor.trim();
}
