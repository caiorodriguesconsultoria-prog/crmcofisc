import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Calendario from "./calendario";

export default async function AgendaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: processos, error } = await supabase
    .from("processos")
    .select("id, numero_contrato, prazo_data, coordenacoes(sigla), fornecedores(nome)")
    .not("prazo_data", "is", null)
    .order("prazo_data");

  const prazos = (processos ?? []).map((p: any) => ({
    id: p.id,
    numeroContrato: p.numero_contrato,
    prazoData: p.prazo_data as string,
    coordenacaoSigla: p.coordenacoes?.sigla ?? "",
    fornecedorNome: p.fornecedores?.nome ?? "",
  }));

  return (
    <main style={{ padding: 32 }}>
      <p>
        <Link href="/dashboard">← Voltar</Link>
      </p>
      <h1 style={{ fontSize: 20, marginTop: 12 }}>Agenda</h1>

      {error && <p style={{ color: "#B0655C" }}>Erro ao carregar: {error.message}</p>}

      <Calendario prazos={prazos} />
    </main>
  );
}
