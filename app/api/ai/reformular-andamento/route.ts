import { NextResponse, type NextRequest } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";

const SISTEMA = `Você reformata anotações informais de andamentos processuais do COFISC/DAF/SCTIE (Ministério da Saúde) em texto claro e formal, em português do Brasil, adequado a um relatório oficial.

Regras:
- Não invente, resuma demais ou remova informações — reescreva só o que foi dado.
- Corrija ortografia, gramática e pontuação.
- Uma ou mais frases coesas, tom formal e objetivo.
- Não acrescente saudação, introdução ou comentário — devolva só o texto reformatado, nada além dele.`;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "IA não configurada" }, { status: 503 });
  }

  const { texto } = (await request.json()) as { texto?: string };
  if (!texto || !texto.trim()) {
    return NextResponse.json({ error: "texto vazio" }, { status: 400 });
  }

  try {
    const openai = new OpenAI();
    const resposta = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [
        { role: "system", content: SISTEMA },
        { role: "user", content: texto },
      ],
    });

    const saida = resposta.choices[0]?.message?.content?.trim();
    if (!saida) {
      return NextResponse.json({ error: "sem resposta da IA" }, { status: 502 });
    }

    return NextResponse.json({ texto: saida });
  } catch {
    return NextResponse.json({ error: "falha ao chamar a IA" }, { status: 502 });
  }
}
