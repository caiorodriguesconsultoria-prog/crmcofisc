const UNIDADES = ["zero", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove"];
const DEZ_A_DEZENOVE = [
  "dez",
  "onze",
  "doze",
  "treze",
  "quatorze",
  "quinze",
  "dezesseis",
  "dezessete",
  "dezoito",
  "dezenove",
];
const DEZENAS = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
const CENTENAS = [
  "",
  "cento",
  "duzentos",
  "trezentos",
  "quatrocentos",
  "quinhentos",
  "seiscentos",
  "setecentos",
  "oitocentos",
  "novecentos",
];

function trezentos(n: number): string {
  if (n === 0) return "";
  if (n === 100) return "cem";

  const c = Math.floor(n / 100);
  const resto = n % 100;
  const partes: string[] = [];

  if (c > 0) partes.push(CENTENAS[c]);

  if (resto > 0) {
    if (resto < 10) partes.push(UNIDADES[resto]);
    else if (resto < 20) partes.push(DEZ_A_DEZENOVE[resto - 10]);
    else {
      const d = Math.floor(resto / 10);
      const u = resto % 10;
      partes.push(u === 0 ? DEZENAS[d] : `${DEZENAS[d]} e ${UNIDADES[u]}`);
    }
  }

  return partes.join(" e ");
}

const ESCALAS: [string, string][] = [
  ["", ""],
  ["mil", "mil"],
  ["milhão", "milhões"],
  ["bilhão", "bilhões"],
];

export function numeroPorExtenso(n: number): string {
  if (n === 0) return "zero";

  const grupos: number[] = [];
  let resto = Math.floor(n);
  while (resto > 0) {
    grupos.push(resto % 1000);
    resto = Math.floor(resto / 1000);
  }

  const partes: string[] = [];
  for (let i = grupos.length - 1; i >= 0; i--) {
    const grupo = grupos[i];
    if (grupo === 0) continue;
    const texto = trezentos(grupo);
    const [singular, plural] = ESCALAS[i] ?? ["", ""];
    if (i === 0) {
      partes.push(texto);
    } else if (i === 1) {
      partes.push(grupo === 1 ? singular : `${texto} ${plural}`);
    } else {
      partes.push(`${texto} ${grupo === 1 ? singular : plural}`);
    }
  }

  if (partes.length === 1) return partes[0];

  const ultima = partes[partes.length - 1];
  const anteriores = partes.slice(0, -1);
  const ultimoGrupo = grupos[0];
  const juntaCom = ultimoGrupo > 0 && ultimoGrupo < 100 ? " e " : ", ";
  return anteriores.join(", ") + juntaCom + ultima;
}

export function valorPorExtenso(valor: number): string {
  const centavos = Math.round(valor * 100);
  const reais = Math.floor(centavos / 100);
  const restoCentavos = centavos % 100;

  const partes: string[] = [];
  if (reais > 0 || restoCentavos === 0) {
    partes.push(`${numeroPorExtenso(reais)} ${reais === 1 ? "real" : "reais"}`);
  }
  if (restoCentavos > 0) {
    partes.push(`${numeroPorExtenso(restoCentavos)} ${restoCentavos === 1 ? "centavo" : "centavos"}`);
  }

  return partes.join(" e ");
}
