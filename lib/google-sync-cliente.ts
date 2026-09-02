// Helper de navegador — dispara a sincronização com o Google Calendar depois
// de uma mutação no Supabase já ter acontecido. Silencioso de propósito: se o
// Google não estiver conectado ainda, ou a chamada falhar, a tarefa/agendamento
// continua salvo normalmente no CRM — a sincronização é um "a mais", nunca
// bloqueia a ação principal.
export async function sincronizarGoogle(params: {
  tipo: "agendamento" | "tarefa" | "andamento";
  acao: "salvar" | "remover" | "concluir";
  id: string;
  googleEventId: string | null;
  numeroContrato: string;
  descricao: string;
  data?: string | null;
  horario?: string | null;
  concluida?: boolean;
  processoId: string;
}) {
  try {
    await fetch("/api/google/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tipo: params.tipo,
        acao: params.acao,
        id: params.id,
        googleEventId: params.googleEventId,
        numeroContrato: params.numeroContrato,
        descricao: params.descricao,
        data: params.data ?? undefined,
        horario: params.horario ?? undefined,
        concluida: params.concluida,
        urlProcesso: `${window.location.origin}/processos/${params.processoId}`,
      }),
    });
  } catch {
    // silencioso — ver comentário acima
  }
}
