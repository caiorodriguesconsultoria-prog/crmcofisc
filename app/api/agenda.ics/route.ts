import { createServiceClient } from "@/lib/supabase/service";

function escaparTexto(texto: string) {
  return texto.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n");
}

function formatarDataIcs(data: string) {
  return data.slice(0, 10).replace(/-/g, "");
}

function formatarCarimboIcs(data: Date) {
  return data.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!process.env.AGENDA_ICS_TOKEN || token !== process.env.AGENDA_ICS_TOKEN) {
    return new Response("Não autorizado", { status: 403 });
  }

  const supabase = createServiceClient();
  const { data: processos, error } = await supabase
    .from("processos")
    .select("id, numero_contrato, prazo_data, coordenacoes(sigla), fornecedores(nome)")
    .not("prazo_data", "is", null);

  if (error) {
    return new Response("Erro ao carregar prazos", { status: 500 });
  }

  const agora = formatarCarimboIcs(new Date());

  const eventos = (processos ?? [])
    .map((p: any) => {
      const resumo = escaparTexto(`${p.numero_contrato} — prazo`);
      const descricao = escaparTexto(
        `Coordenação: ${p.coordenacoes?.sigla ?? ""} · Fornecedor: ${p.fornecedores?.nome ?? ""}`,
      );
      return [
        "BEGIN:VEVENT",
        `UID:${p.id}@crmcofisc`,
        `DTSTAMP:${agora}`,
        `DTSTART;VALUE=DATE:${formatarDataIcs(p.prazo_data)}`,
        `SUMMARY:${resumo}`,
        `DESCRIPTION:${descricao}`,
        `URL:${url.origin}/processos/${p.id}`,
        "END:VEVENT",
      ].join("\r\n");
    })
    .join("\r\n");

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//CRM-COFISC//Agenda//PT-BR",
    "CALSCALE:GREGORIAN",
    "X-WR-CALNAME:CRM-COFISC — Prazos",
    eventos,
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": "inline; filename=crmcofisc-prazos.ics",
    },
  });
}
