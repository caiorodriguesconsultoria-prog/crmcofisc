import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { notificarErroAdmins } from "@/lib/alerta-erro";

// Endpoint público pra monitor externo (ex.: UptimeRobot) checar se o CRM
// está de pé de verdade — não só "o servidor respondeu", mas "o banco
// respondeu". Sem dado sensível na resposta, só ok/erro genérico.
//
// Teste seguro (sem derrubar o sistema de verdade): ligar a env var
// FORCAR_FALHA_STATUS=true na Vercel por 1-2 minutos, confirmar que o
// monitor externo (UptimeRobot) detectou, depois desligar a env var. Esse
// caminho de teste não dispara o push interno de propósito (só os casos
// reais de falha, logo abaixo, disparam) — senão todo teste gera aviso.
export async function GET(request: NextRequest) {
  if (process.env.FORCAR_FALHA_STATUS === "true") {
    return NextResponse.json(
      { sistema: "CRM-COFISC", status: "erro", motivo: "falha forçada para teste" },
      { status: 500 },
    );
  }

  try {
    const supabase = createServiceClient();
    const { error } = await supabase
      .from("coordenacoes")
      .select("id", { count: "exact", head: true });

    if (error) {
      // Erro controlado (não é exceção) — por isso não passa pelo
      // instrumentation.ts/onRequestError, que só pega exceção não tratada.
      // Avisa aqui explicitamente, pra não depender só do UptimeRobot bater
      // de novo pra descobrir que caiu.
      await notificarErroAdmins("/api/status", `Banco não respondeu: ${error.message}`);
      return NextResponse.json(
        { sistema: "CRM-COFISC", status: "erro", motivo: "banco não respondeu" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      sistema: "CRM-COFISC",
      status: "ok",
      horario: new Date().toISOString(),
    });
  } catch (erro) {
    await notificarErroAdmins("/api/status", erro instanceof Error ? erro.message : String(erro));
    return NextResponse.json(
      { sistema: "CRM-COFISC", status: "erro", motivo: "falha inesperada" },
      { status: 500 },
    );
  }
}
