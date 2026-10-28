import { NextResponse, type NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { construirBlocoAnexo, extrairTextoResposta, TAMANHO_MAXIMO_ANEXO_BYTES, tipoAnexoValido } from "@/lib/ia-anexo";

const SISTEMA = `Você extrai dados de pauta de distribuição de contratos administrativos do Ministério da Saúde (Brasil) pra um sistema de gestão de contratos (COFISC/DAF/SCTIE).

A "pauta de distribuição" lista, pra cada parcela de entrega de um contrato, quanto vai pra cada UF (estado) de destino — normalmente uma tabela com colunas como UF/Estado, Quantidade e, às vezes, Parcela e Data de entrega.

Leia o documento anexado (PDF, foto/imagem, ou planilha já convertida em texto/CSV) e devolva APENAS um JSON válido (sem markdown, sem comentário, sem texto antes ou depois), exatamente neste formato:

{
  "linhas": [
    {
      "uf": string,
      "quantidade": number,
      "numero_parcela": number ou null,
      "data_entrega": "AAAA-MM-DD" ou null
    }
  ]
}

Regras:
- "uf" é a sigla do estado (ex.: "SP", "RJ", "BA") ou "Almoxarifado MS" quando for o caso — nunca invente, use exatamente como está escrito no documento (normalizando pra sigla de 2 letras quando o nome completo do estado aparecer, ex. "São Paulo" → "SP").
- "quantidade" é o número de unidades destinadas àquela UF naquela linha.
- "numero_parcela" é o número da parcela de entrega à qual a linha pertence (1ª, 2ª, 3ª...), se o documento indicar isso — use só o número, sem o "ª". Se o documento não separar por parcela, devolva null.
- "data_entrega" é a data prevista/realizada de entrega daquela linha, se indicada no documento, no formato AAAA-MM-DD. Nunca invente — use null se não tiver certeza.
- Uma linha por combinação UF+parcela. Se a mesma UF aparecer em parcelas diferentes, devolva uma linha pra cada.
- Nunca invente valores que não estão no documento — use null (exceto "uf" e "quantidade", que são obrigatórios; se uma linha não tiver essas duas informações, não a inclua).
- Ignore linhas de totalização/resumo (ex.: uma linha "TOTAL" no fim de uma tabela) — não são linhas de distribuição.
- Se não encontrar nenhuma linha de pauta de distribuição no documento, devolva "linhas": [].
- Responda só com o JSON, compacto (sem indentação/quebra de linha desnecessária) — isso evita estourar o limite de tamanho da resposta em documentos com muitas linhas.`;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "IA não configurada" }, { status: 503 });
  }

  const formData = await request.formData();
  const arquivo = formData.get("arquivo");
  if (!(arquivo instanceof File)) {
    return NextResponse.json({ error: "arquivo não enviado" }, { status: 400 });
  }
  if (!tipoAnexoValido(arquivo.type)) {
    return NextResponse.json({ error: "envie um PDF, uma imagem (JPG, PNG ou WEBP) ou uma planilha (XLSX/XLS)" }, { status: 400 });
  }
  if (arquivo.size > TAMANHO_MAXIMO_ANEXO_BYTES) {
    return NextResponse.json({ error: "Arquivo muito grande (máximo 4MB)" }, { status: 400 });
  }

  try {
    const blocoAnexo = await construirBlocoAnexo(arquivo);
    const anthropic = new Anthropic();
    const resposta = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 8192,
      system: SISTEMA,
      messages: [
        {
          role: "user",
          content: [blocoAnexo, { type: "text", text: "Extraia a pauta de distribuição conforme as instruções." }],
        },
      ],
    });

    const textoLimpo = extrairTextoResposta(resposta);
    const dados = JSON.parse(textoLimpo);
    return NextResponse.json({ dados });
  } catch (erro) {
    return NextResponse.json(
      { error: erro instanceof Error ? erro.message : "falha ao processar o anexo" },
      { status: 502 },
    );
  }
}
