import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import QuadroResumitivo from "./quadro-resumitivo";
import CronogramaRelatorio from "./cronograma-relatorio";
import PautaDistribuicao from "./pauta-distribuicao";
import DadosEntrega from "./dados-entrega";
import Ocorrencias from "./ocorrencias";
import ConclusaoRelatorio from "./conclusao-relatorio";

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
      "id, numero_contrato, objeto, quantidade_contratada, data_assinatura, vigencia_inicio, vigencia_fim, processo_eletronico_numero, pregao_eletronico_numero, ata_registro_precos_numero, publicacao_dou, publicacao_pncp, valor_unitario, valor_global, valor_garantia, portaria_designacao_fiscal, nota_empenho_numero, programa_trabalho, natureza_despesa, local_entrega, conclusao_tipo, conclusao_checks, conclusao_texto, conclusao_penalidade, fornecedores(nome, cnpj), gestor:pessoas!processos_gestor_id_fkey(nome, matricula), gestor_substituto:pessoas!processos_gestor_substituto_id_fkey(nome, matricula), fiscal:pessoas!processos_fiscal_id_fkey(nome, matricula), fiscal_substituto:pessoas!processos_fiscal_substituto_id_fkey(nome, matricula)",
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
    .select("id, uf, quantidade")
    .eq("processo_id", id)
    .order("created_at");

  const { data: entregas } = await supabase
    .from("processo_entregas")
    .select(
      "id, local_entrega, quantidade, valor_total_nf, danfe_venda, danfe_remessa, lote, data_fabricacao, data_validade, data_entrega, responsavel, atraso_dias, percentual_transcurso",
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
    <main style={{ padding: 32, maxWidth: 760 }}>
      <p>
        <Link href={`/processos/${id}`}>← Voltar ao processo</Link>
      </p>
      <h1 style={{ fontSize: 20, marginTop: 12 }}>Relatório — {p.numero_contrato}</h1>

      {error && <p style={{ color: "#B0655C" }}>Erro ao carregar: {(error as any).message}</p>}

      <QuadroResumitivo processoId={id} processo={p} />

      <CronogramaRelatorio execucoes={(execucoes ?? []) as any} />

      <h2 style={{ fontSize: 16, marginTop: 24 }}>Execução do contrato</h2>

      <PautaDistribuicao processoId={id} pauta={(pauta ?? []) as any} />

      <DadosEntrega processoId={id} entregas={(entregas ?? []) as any} />

      <Ocorrencias andamentos={(andamentosIncluidos ?? []) as any} />

      <ConclusaoRelatorio
        conclusao={{
          tipo: p.conclusao_tipo,
          checks: p.conclusao_checks,
          texto: p.conclusao_texto,
          penalidade: p.conclusao_penalidade,
        }}
      />
    </main>
  );
}
