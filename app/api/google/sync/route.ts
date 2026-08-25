import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { criarOuAtualizarEventoGoogle, removerEventoGoogle } from "@/lib/google-calendar";

// Chamado pelo navegador logo depois de criar/editar/remover/concluir um
// agendamento ou tarefa — o cliente já tem os dados na mão (não busca de
// novo aqui), só passa o suficiente pra montar o evento e salva o
// google_event_id resultante de volta na linha, pra saber qual atualizar
// ou remover da próxima vez.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { tipo, acao, id, googleEventId, numeroContrato, descricao, data, horario, urlProcesso } = body as {
    tipo: "agendamento" | "tarefa";
    acao: "salvar" | "remover";
    id: string;
    googleEventId: string | null;
    numeroContrato: string;
    descricao: string;
    data?: string;
    horario?: string;
    urlProcesso: string;
  };

  if (tipo !== "agendamento" && tipo !== "tarefa") {
    return NextResponse.json({ error: "tipo inválido" }, { status: 400 });
  }
  const tabela = tipo === "agendamento" ? "processo_agendamentos" : "processo_tarefas";

  if (acao === "remover") {
    if (googleEventId) await removerEventoGoogle(googleEventId);
    return NextResponse.json({ ok: true });
  }

  if (!data || !horario) {
    return NextResponse.json({ ok: true });
  }

  const resumo = `CT ${numeroContrato} - ${descricao}`;
  const novoGoogleEventId = await criarOuAtualizarEventoGoogle({
    googleEventId,
    resumo,
    data,
    horario,
    url: urlProcesso,
  });

  if (novoGoogleEventId) {
    const service = createServiceClient();
    await service.from(tabela).update({ google_event_id: novoGoogleEventId }).eq("id", id);
  }

  return NextResponse.json({ ok: true, googleEventId: novoGoogleEventId });
}
