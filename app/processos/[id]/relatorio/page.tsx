import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import QuadroResumitivo from "./quadro-resumitivo";
import CronogramaRelatorio from "./cronograma-relatorio";

export default async function RelatorioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: processo, error } = await supabase
    .from("processos")
    .select(
      "id, numero_contrato, objeto, quantidade_contratada, data_assinatura, vigencia_inicio, vigencia_fim, processo_eletronico_numero, pregao_eletronico_numero, ata_registro_precos_numero, publicacao_dou, publicacao_pncp, valor_unitario, valor_global, valor_garantia, portaria_designacao_fiscal, nota_empenho_numero, programa_trabalho, natureza_despesa, local_entrega, fornecedores(nome, cnpj), gestor:pessoas!processos_gestor_id_fkey(nome, matricula), gestor_substituto:pessoas!processos_gestor_substituto_id_fkey(nome, matricula), fiscal:pessoas!processos_fiscal_id_fkey(nome, matricula), fiscal_substituto:pessoas!processos_fiscal_substituto_id_fkey(nome, matricula)",
    )
    .eq("id", id)
    .single();

  if (error || !processo) {
    notFound();
  }

  const p = processo as any;

  const { data: execucoes } = await supabase
    .from("processo_execucoes")
    .select("id, numero, quantidade, unidade, data_prevista, data_entrega")
    .eq("processo_id", id)
    .order("numero");

  return (
    <main style={{ padding: 32, maxWidth: 760 }}>
      <p>
        <Link href={`/processos/${id}`}>← Voltar ao processo</Link>
      </p>
      <h1 style={{ fontSize: 20, marginTop: 12 }}>Relatório — {p.numero_contrato}</h1>

      {error && <p style={{ color: "#B0655C" }}>Erro ao carregar: {(error as any).message}</p>}

      <QuadroResumitivo processoId={id} processo={p} />

      <CronogramaRelatorio execucoes={(execucoes ?? []) as any} />
    </main>
  );
}
