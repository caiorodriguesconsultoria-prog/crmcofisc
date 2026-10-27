import * as XLSX from "xlsx";
import type Anthropic from "@anthropic-ai/sdk";

// Mesmo anexo (PDF, foto ou planilha) usado nos 3 botões de extração por IA
// (contrato, pauta de distribuição, dados de entrega) — centraliza o tipo
// aceito e como cada um vira um bloco de conteúdo pra mandar pro Claude.
// PDF/imagem vão como documento/imagem de verdade (a API da Anthropic lê
// direto); planilha (.xlsx/.xls) não tem suporte nativo, então é convertida
// pra texto (CSV por aba) antes de mandar — a IA lê a tabela em texto.
export const TIPOS_ACEITOS_ANEXO =
  "application/pdf,image/png,image/jpeg,image/webp,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel";

const TIPO_POR_MIME: Record<string, "document" | "image" | "planilha"> = {
  "application/pdf": "document",
  "image/png": "image",
  "image/jpeg": "image",
  "image/webp": "image",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "planilha",
  "application/vnd.ms-excel": "planilha",
};

// Funções serverless da Vercel têm um teto de tamanho de corpo da requisição
// bem menor que o da API da Anthropic — limite conservador.
export const TAMANHO_MAXIMO_ANEXO_BYTES = 4 * 1024 * 1024;

export function tipoAnexoValido(mime: string): boolean {
  return mime in TIPO_POR_MIME;
}

export async function construirBlocoAnexo(arquivo: File): Promise<Anthropic.Messages.ContentBlockParam> {
  const tipo = TIPO_POR_MIME[arquivo.type];
  const buffer = Buffer.from(await arquivo.arrayBuffer());

  if (tipo === "planilha") {
    const planilha = XLSX.read(buffer, { type: "buffer" });
    const textoAbas = planilha.SheetNames.map((nome) => {
      const csv = XLSX.utils.sheet_to_csv(planilha.Sheets[nome]);
      return `--- Aba: ${nome} ---\n${csv}`;
    }).join("\n\n");
    return { type: "text", text: textoAbas || "(planilha vazia)" };
  }

  return {
    type: tipo,
    source: { type: "base64", media_type: arquivo.type, data: buffer.toString("base64") },
  } as Anthropic.Messages.ContentBlockParam;
}
