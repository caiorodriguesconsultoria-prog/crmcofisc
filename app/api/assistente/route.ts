import { NextResponse, type NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { betaTool } from "@anthropic-ai/sdk/helpers/beta/json-schema";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { statusParcela, type ParcelaStatus } from "@/lib/status-entrega";
import { relatorioDesatualizado } from "@/lib/relatorio-status";

// Assistente de IA do CRM (Fase 1: pesquisa sobre contratos) — pedido do
// Caio pra responder perguntas em linguagem natural usando os dados do
// sistema, em vez de ele caçar informação espalhada entre telas. A IA só
// responde com o que as ferramentas abaixo devolvem (nunca inventa dado) —
// e cada ferramenta roda a consulta usando o MESMO cliente Supabase
// autenticado da sessão de quem perguntou, então o RLS do banco já filtra
// sozinho o que essa pessoa pode ver (hoje só o Caio; quando a equipe
// entrar, cada um continua vendo só o que já veria em qualquer outra tela
// do CRM — nenhum acesso "admin" solto aqui).

const SISTEMA = `Você é o assistente de IA do CRM-COFISC (Coordenação-Geral de Fiscalização de Contratos, DAF/SCTIE, Ministério da Saúde). Ajuda o Caio a pesquisar informações sobre os contratos cadastrados no sistema.

Regras:
- Responda em português do Brasil, direto e objetivo.
- Use SEMPRE as ferramentas disponíveis pra buscar dado real — nunca invente número de contrato, data, valor ou status.
- Se a ferramenta não encontrar o contrato ou não achar nada, diga isso claramente em vez de supor.
- Cite o número do contrato nas respostas quando fizer sentido, pra ficar fácil conferir.
- Respostas curtas e escaneáveis — listas quando fizer sentido, sem parágrafo longo.`;

function buscarHistoricoContrato(supabase: SupabaseClient) {
  return betaTool({
    name: "historico_contrato",
    description:
      "Busca o histórico completo de um contrato pelo número (ex.: '294/2026'): dados principais, cronograma de entregas (parcelas e status) e os andamentos mais recentes.",
    inputSchema: {
      type: "object",
      properties: {
        numero_contrato: {
          type: "string",
          description: "Número do contrato, como aparece no sistema (ex.: '294/2026').",
        },
      },
      required: ["numero_contrato"],
      additionalProperties: false,
    },
    run: async ({ numero_contrato }) => {
      const { data: processo } = await supabase
        .from("processos")
        .select(
          "id, numero_contrato, nup_principal, objeto, etapa_atual, situacao, relatorio_atualizado_em, coordenacoes(sigla), fornecedores(nome)",
        )
        .ilike("numero_contrato", `${numero_contrato}%`)
        .maybeSingle();

      if (!processo) {
        return JSON.stringify({ encontrado: false, motivo: "Nenhum contrato encontrado com esse número." });
      }

      const [{ data: andamentosRaw }, { data: tagsRaw }, { data: execucoesRaw }] = await Promise.all([
        supabase
          .from("andamentos")
          .select("tipo, texto, data, autor:pessoas(nome)")
          .eq("processo_id", processo.id)
          .order("data", { ascending: false })
          .limit(15),
        supabase.from("processo_tags").select("tags(valor)").eq("processo_id", processo.id),
        supabase
          .from("processo_execucoes")
          .select(
            "numero, quantidade, data_prevista, processo_entrega_lancamentos(id, tipo, lancamento_pai_id, quantidade_normal, quantidade_avaria, quantidade_desvio, data_entrega)",
          )
          .eq("processo_id", processo.id)
          .order("numero"),
      ]);

      const hoje = new Date().toISOString().slice(0, 10);
      const parcelas = (execucoesRaw ?? []).map((e: any) => {
        const parcela: ParcelaStatus = {
          numero: Number(e.numero),
          quantidade: Number(e.quantidade),
          data_prevista: e.data_prevista,
          lancamentos: (e.processo_entrega_lancamentos ?? []).map((l: any) => ({
            id: l.id,
            tipo: l.tipo,
            lancamento_pai_id: l.lancamento_pai_id,
            quantidade_normal: Number(l.quantidade_normal),
            quantidade_avaria: Number(l.quantidade_avaria),
            quantidade_desvio: Number(l.quantidade_desvio),
            data_entrega: l.data_entrega,
          })),
        };
        return {
          numero: parcela.numero,
          data_prevista: parcela.data_prevista,
          status: statusParcela(parcela, hoje),
        };
      });

      return JSON.stringify({
        encontrado: true,
        numero_contrato: processo.numero_contrato,
        nup_principal: processo.nup_principal,
        objeto: processo.objeto,
        etapa_atual: processo.etapa_atual,
        situacao: processo.situacao,
        coordenacao: (processo as any).coordenacoes?.sigla ?? null,
        fornecedor: (processo as any).fornecedores?.nome ?? null,
        relatorio_desatualizado: relatorioDesatualizado(processo.relatorio_atualizado_em as string | null),
        tags_ativas: (tagsRaw ?? []).map((t: any) => t.tags?.valor).filter(Boolean),
        parcelas,
        andamentos_recentes: (andamentosRaw ?? []).map((a: any) => ({
          data: a.data,
          tipo: a.tipo,
          texto: a.texto,
          autor: a.autor?.nome ?? null,
        })),
      });
    },
  });
}

const LIMITE_MENSAGENS = 20;
const LIMITE_CARACTERES = 2000;

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

  const corpo = (await request.json()) as { mensagens?: { role: "user" | "assistant"; content: string }[] };
  const mensagens = corpo.mensagens ?? [];

  if (
    !Array.isArray(mensagens) ||
    mensagens.length === 0 ||
    mensagens.length > LIMITE_MENSAGENS ||
    mensagens.some(
      (m) =>
        (m.role !== "user" && m.role !== "assistant") ||
        typeof m.content !== "string" ||
        !m.content.trim() ||
        m.content.length > LIMITE_CARACTERES,
    )
  ) {
    return NextResponse.json({ error: "conversa inválida" }, { status: 400 });
  }

  // Performance Engineering (item 19 — streaming nas respostas de IA): antes,
  // a resposta só chegava ao navegador depois do toolRunner terminar por
  // completo (podia levar vários segundos com a chamada de ferramenta no
  // meio). Agora o texto é transmitido conforme o Claude gera, igual a um
  // chat normal — e o encerramento da conexão pelo navegador (troca de aba,
  // cancelamento) interrompe o consumo do stream em vez de continuar
  // gerando uma resposta que ninguém vai ler.
  const encoder = new TextEncoder();
  let abortado = false;
  request.signal.addEventListener("abort", () => {
    abortado = true;
  });

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let enviouTexto = false;
      try {
        const anthropic = new Anthropic();
        const runner = anthropic.beta.messages.toolRunner({
          model: "claude-opus-5-5",
          max_tokens: 4096,
          system: SISTEMA,
          tools: [buscarHistoricoContrato(supabase)],
          messages: mensagens,
          stream: true,
        });

        for await (const messageStream of runner) {
          if (abortado) break;
          for await (const event of messageStream) {
            if (abortado) break;
            if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
              enviouTexto = true;
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
          if (abortado) break;
          await messageStream.finalMessage();
        }

        if (!enviouTexto && !abortado) {
          controller.enqueue(encoder.encode("Não consegui gerar uma resposta agora. Tenta de novo?"));
        }
      } catch {
        if (!abortado && !enviouTexto) {
          controller.enqueue(encoder.encode("Não consegui consultar a IA agora. Tenta de novo?"));
        }
      } finally {
        controller.close();
      }
    },
    cancel() {
      abortado = true;
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
