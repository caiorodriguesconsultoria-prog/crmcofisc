import { NextResponse, type NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

const SISTEMA = `Você extrai dados estruturados de contratos administrativos do Ministério da Saúde (Brasil), publicados no SEI, pro Quadro Resumitivo de um sistema de gestão de contratos (COFISC/DAF/SCTIE).

Leia o documento do contrato (pode ser o PDF inteiro, ou uma foto/imagem só da tabela de itens e/ou do cronograma de entrega) e devolva APENAS um JSON válido (sem markdown, sem comentário, sem texto antes ou depois), exatamente neste formato:

{
  "numero_contrato": string ou null,
  "nup_principal": string ou null,
  "objeto": string ou null,
  "unidade_medida": string ou null,
  "processo_eletronico_numero": string ou null,
  "pregao_eletronico_numero": string ou null,
  "ata_registro_precos_numero": string ou null,
  "data_assinatura": "AAAA-MM-DD" ou null,
  "vigencia_inicio": "AAAA-MM-DD" ou null,
  "vigencia_fim": "AAAA-MM-DD" ou null,
  "publicacao_dou": string ou null,
  "publicacao_pncp": string ou null,
  "valor_global": number ou null,
  "valor_garantia": number ou null,
  "portaria_designacao_fiscal": string ou null,
  "nota_empenho_numero": string ou null,
  "programa_trabalho": string ou null,
  "natureza_despesa": string ou null,
  "local_entrega": string ou null,
  "itens": [
    {
      "numero": number,
      "descricao": string,
      "catmat": string ou null,
      "unidade_medida": string ou null,
      "quantidade": number ou null,
      "valor_unitario": number ou null,
      "parcelas": [
        {
          "numero": number,
          "quantidade": number,
          "data_prevista": "AAAA-MM-DD" ou null
        }
      ]
    }
  ]
}

Regras:
- Nunca invente um valor que não está no documento — use null.
- "numero_contrato" no formato "255/2026" (sem o número do processo SEI junto).
- "nup_principal" é o número do Processo SEI (ex.: "25000.054774/2024-67"), não o número do documento SEI do contrato em si.
- Datas sempre no formato AAAA-MM-DD.
- Valores monetários como número puro (sem "R$", sem separador de milhar) — use o valor em reais (R$), mesmo quando o contrato também tiver valores em moeda estrangeira.
- "itens" é a tabela de itens do contrato (coluna ITEM/DESCRIÇÃO/CATMAT/UNIDADE/QUANTIDADE/VALOR UNITÁRIO) — um item por linha dessa tabela. Se o contrato tiver só um item, devolva mesmo assim como lista com 1 elemento.
- Além da tabela formal de itens, CONTINUE a numeração e inclua também qualquer item complementar/acessório do contrato que tenha seu próprio cronograma de entrega (parcelas com quantitativo e prazo), mesmo que ele apareça fora da tabela principal, sem CATMAT e sem valor unitário — por exemplo "caneta reutilizável", "seringa", brindes, acessórios ou similares mencionados em outra cláusula. Nesses casos, "catmat" e "valor_unitario" ficam null, mas "descricao", "quantidade" e "parcelas" devem vir preenchidos normalmente. Não pule nenhum bloco de cronograma de entrega do documento, esteja ele onde estiver.
- "parcelas" vem do cronograma de entrega de cada item (tabela PARCELAS/QUANTITATIVO/PRAZO MÁXIMO DE ENTREGA, numerada "1ª", "2ª" etc. — use só o número, sem o "ª"). Se o prazo for descrito como "N dias após a assinatura do contrato" (ou "da assinatura", "contados da assinatura" etc.) E você já souber "data_assinatura", calcule "data_prevista" somando N dias corridos a essa data e devolva no formato AAAA-MM-DD. Se "data_assinatura" for null, ou o prazo não for relativo à assinatura, ou você não tiver certeza da conta, devolva "data_prevista": null — nunca adivinhe uma data.
- Se um item não tiver tabela de cronograma de entrega visível, devolva "parcelas": [] pra ele.
- Se a imagem/PDF mostrar só a tabela de itens e/ou de cronograma (sem o texto do contrato inteiro), preencha só o que der pra ler dessa tabela e devolva null nos demais campos — não é erro, é esperado.
- Se não encontrar a informação de algum campo, use null — nunca omita a chave.`;

const TIPOS_ACEITOS: Record<string, string> = {
  "application/pdf": "document",
  "image/png": "image",
  "image/jpeg": "image",
  "image/webp": "image",
};

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
  const tipoBloco = TIPOS_ACEITOS[arquivo.type];
  if (!tipoBloco) {
    return NextResponse.json({ error: "envie um PDF ou uma imagem (JPG, PNG ou WEBP)" }, { status: 400 });
  }
  // Limite conservador — funções serverless da Vercel têm um teto de
  // tamanho de corpo da requisição bem menor que o da API da Anthropic.
  const TAMANHO_MAXIMO_BYTES = 4 * 1024 * 1024;
  if (arquivo.size > TAMANHO_MAXIMO_BYTES) {
    return NextResponse.json({ error: "Arquivo muito grande (máximo 4MB)" }, { status: 400 });
  }

  const base64 = Buffer.from(await arquivo.arrayBuffer()).toString("base64");

  try {
    const anthropic = new Anthropic();
    const resposta = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 6144,
      system: SISTEMA,
      messages: [
        {
          role: "user",
          content: [
            {
              type: tipoBloco,
              source: { type: "base64", media_type: arquivo.type, data: base64 },
            } as Anthropic.Messages.ContentBlockParam,
            { type: "text", text: "Extraia os dados desse contrato conforme as instruções." },
          ],
        },
      ],
    });

    const bloco = resposta.content.find((b) => b.type === "text");
    if (!bloco || bloco.type !== "text") {
      return NextResponse.json({ error: "sem resposta da IA" }, { status: 502 });
    }

    // A IA pode devolver o JSON dentro de um bloco ```json ... ``` apesar da
    // instrução de não fazer isso — removido com segurança se aparecer.
    const textoLimpo = bloco.text.trim().replace(/^```json\s*|```\s*$/g, "").trim();
    const dados = JSON.parse(textoLimpo);
    return NextResponse.json({ dados });
  } catch (erro) {
    return NextResponse.json(
      { error: erro instanceof Error ? erro.message : "falha ao processar o PDF" },
      { status: 502 },
    );
  }
}
