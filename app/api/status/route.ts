import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

// Endpoint público pra monitor externo (ex.: UptimeRobot) checar se o CRM
// está de pé de verdade — não só "o servidor respondeu", mas "o banco
// respondeu". Sem dado sensível na resposta, só ok/erro genérico.
//
// Teste seguro (sem derrubar o sistema de verdade): ligar a env var
// FORCAR_FALHA_STATUS=true na Vercel por 1-2 minutos, confirmar que o
// monitor detectou e o alerta chegou, depois desligar a env var.
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
  } catch {
    return NextResponse.json(
      { sistema: "CRM-COFISC", status: "erro", motivo: "falha inesperada" },
      { status: 500 },
    );
  }
}
