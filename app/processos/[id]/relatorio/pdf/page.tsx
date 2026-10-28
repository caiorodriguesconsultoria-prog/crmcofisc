import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Documento from "./documento";

export default async function RelatorioPdfPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  if (!user) {
    redirect("/login");
  }

  const { data: processo, error } = await supabase
    .from("processos")
    .select(
      "id, numero_contrato, nup_principal, objeto, quantidade_contratada, data_assinatura, vigencia_inicio, vigencia_fim, processo_eletronico_numero, pregao_eletronico_numero, pregao_eletronico_numero_sei, publicacao_dou_pregao, publicacao_dou_pregao_sei, publicacao_pncp_pregao, publicacao_pncp_pregao_sei, ata_registro_precos_numero, ata_registro_precos_numero_sei, publicacao_dou_ata, publicacao_dou_ata_sei, publicacao_pncp_ata, publicacao_pncp_ata_sei, numero_contrato_sei, publicacao_dou, publicacao_dou_sei, publicacao_pncp, publicacao_pncp_sei, valor_unitario, valor_global, valor_garantia, portaria_designacao_fiscal, nota_empenho_numero, programa_trabalho, natureza_despesa, local_entrega, unidade_medida, conclusao_tipo, conclusao_checks, conclusao_texto, conclusao_penalidade, fornecedores(nome, cnpj), coordenacoes(nome, sigla), gestor:pessoas!processos_gestor_id_fkey(nome, matricula), gestor_substituto:pessoas!processos_gestor_substituto_id_fkey(nome, matricula), fiscal:pessoas!processos_fiscal_id_fkey(nome, matricula), fiscal_substituto:pessoas!processos_fiscal_substituto_id_fkey(nome, matricula)",
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

  const { data: pauta } = await supabase
    .from("processo_pauta_distribuicao")
    .select("id, uf, quantidade, data_entrega")
    .eq("processo_id", id)
    .order("created_at");

  const { data: entregas } = await supabase
    .from("processo_entregas")
    .select(
      "id, local_entrega, quantidade, valor_total_nf, danfe_venda, danfe_remessa, lote, data_fabricacao, data_validade, data_entrega, responsavel",
    )
    .eq("processo_id", id)
    .order("created_at");

  const { data: andamentosIncluidos } = await supabase
    .from("andamentos")
    .select("id, texto")
    .eq("processo_id", id)
    .eq("incluir_relatorio", true)
    .order("data");

  return (
    <main style={{ padding: 32, maxWidth: 900, margin: "0 auto" }}>
      <p className="no-print">
        <Link href={`/processos/${id}`}>← Voltar ao contrato</Link>
      </p>

      {error && <p style={{ color: "#B0655C" }}>Erro ao carregar: {(error as any).message}</p>}

      <Documento
        processo={p}
        execucoes={(execucoes ?? []) as any}
        pauta={(pauta ?? []) as any}
        entregas={(entregas ?? []) as any}
        andamentos={(andamentosIncluidos ?? []) as any}
      />
    </main>
  );
}
