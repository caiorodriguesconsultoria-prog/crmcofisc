import { NextResponse, type NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { construirBlocoAnexo, extrairTextoResposta, TAMANHO_MAXIMO_ANEXO_BYTES, tipoAnexoValido } from "@/lib/ia-anexo";

const SISTEMA = `Você extrai dados de entrega (notas fiscais/DANFEs de entregas já realizadas) de contratos administrativos do Ministério da Saúde (Brasil) pra um sistema de gestão de contratos (COFISC/DAF/SCTIE).

O documento anexado pode ser uma nota fiscal, um romaneio/comprovante de entrega, ou uma planilha de controle de entregas — normalmente contendo local de entrega, quantidade, valor, números de DANFE, lote, datas de fabricação/validade/entrega e responsável pelo recebimento.

Leia o documento anexado (PDF, foto/imagem, ou planilha já convertida em texto/CSV) e devolva APENAS um JSON válido (sem markdown, sem comentário, sem texto antes ou depois), exatamente neste formato:

{
  "entregas": [
    {
      "local_entrega": string ou null,
      "quantidade": number ou null,
      "valor_total_nf": number ou null,
      "danfe_venda": string ou null,
      "danfe_remessa": string ou null,
      "lote": string ou null,
      "data_fabricacao": "AAAA-MM-DD" ou null,
      "data_validade": "AAAA-MM-DD" ou null,
      "data_entrega": "AAAA-MM-DD" ou null,
      "responsavel": string ou null
    }
  ]
}

Regras:
- Uma entrada por nota fiscal/entrega distinta. Se o documento cobrir várias notas fiscais ou vários locais de entrega, devolva uma entrada pra cada.
- "valor_total_nf" é o valor total da nota fiscal, como número puro (sem "R$", sem separador de milhar).
- "danfe_venda" e "danfe_remessa" são os números/chaves das DANFEs de venda e de remessa, quando o documento distinguir os dois tipos — se só houver um número de DANFE sem indicação do tipo, use "danfe_venda".
- Datas sempre no formato AAAA-MM-DD.
- "responsavel" é quem recebeu/assinou a entrega, se constar no documento.
- Nunca invente valores que não estão no documento — use null.
- "atraso_dias" e "percentual_transcurso" NÃO entram nesse JSON — são sempre preenchidos manualmente no sistema, não vêm de documento.
- Se uma célula de data tiver texto que não é uma data real (ex.: "Aguardando Agenda", "Agendado p/ 11/11", "#VALUE!", vazio), devolva null pra esse campo — nunca tente adivinhar ou forçar uma data a partir de texto assim.
- Ignore linhas de totalização/resumo (ex.: uma linha "TOTAL" no fim de uma tabela) — não são entregas.
- Se não encontrar nenhuma entrega no documento, devolva "entregas": [].
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
          content: [blocoAnexo, { type: "text", text: "Extraia os dados de entrega conforme as instruções." }],
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
