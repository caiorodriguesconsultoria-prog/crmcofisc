// Máscara de valor em reais em tempo real (mesmo padrão da quantidade do
// cronograma — ponto de milhar, vírgula decimal), travada em 2 casas
// decimais. <input type="number"> não aceita vírgula como decimal (padrão
// brasileiro), então um valor digitado como "3.352.500,72" ficava
// truncado/rejeitado e o que ia pro banco não batia com o que foi digitado.
export function formatarMoedaBR(valorDigitado: string): string {
  const limpo = valorDigitado.replace(/[^\d,]/g, "");
  const [inteiroBruto, ...resto] = limpo.split(",");
  const inteiro = inteiroBruto.replace(/^0+(?=\d)/, "");
  const inteiroFormatado = inteiro ? Number(inteiro).toLocaleString("pt-BR") : "";
  const decimal = resto.length > 0 ? "," + resto.join("").slice(0, 2) : "";
  return inteiroFormatado + decimal;
}

export function paraNumeroMoeda(valorFormatado: string): number | null {
  const normalizado = valorFormatado.replace(/\./g, "").replace(",", ".");
  return normalizado ? Number(normalizado) : null;
}

export function moedaParaFormatado(valor: number | null | undefined): string {
  if (valor == null) return "";
  return valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
