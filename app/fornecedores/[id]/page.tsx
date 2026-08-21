import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function formatarData(data: string | null) {
  return data ? new Date(data).toLocaleDateString("pt-BR") : "—";
}

function formatarValor(valor: number | null) {
  return valor != null
    ? valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    : "—";
}

export default async function FornecedorPage({
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

  const { data: fornecedor, error: erroFornecedor } = await supabase
    .from("fornecedores")
    .select("id, nome, cnpj, endereco, preposto, telefone, fornecedor_emails(email, rotulo)")
    .eq("id", id)
    .single();

  if (erroFornecedor || !fornecedor) {
    notFound();
  }

  const { data: contratos, error: erroContratos } = await supabase
    .from("processos")
    .select(
      "id, numero_contrato, valor_global, vigencia_inicio, vigencia_fim, etapa_atual, situacao, coordenacoes(sigla)",
    )
    .eq("fornecedor_id", id)
    .order("created_at", { ascending: false });

  return (
    <main style={{ padding: 32, maxWidth: 800 }}>
      <p>
        <Link href="/fornecedores">← Voltar</Link>
      </p>
      <h1 style={{ fontSize: 20, marginTop: 12 }}>{fornecedor.nome}</h1>
      <p style={{ color: "#605D5D" }}>{fornecedor.cnpj}</p>
      <p>
        Preposto: {fornecedor.preposto || "—"} · Telefone: {fornecedor.telefone || "—"}
      </p>
      <p>
        E-mails:{" "}
        {(fornecedor.fornecedor_emails ?? [])
          .map((e: { email: string; rotulo: string | null }) =>
            e.rotulo ? `${e.email} (${e.rotulo})` : e.email,
          )
          .join(", ") || "—"}
      </p>
      {fornecedor.endereco && <p>Endereço: {fornecedor.endereco}</p>}

      <h2 style={{ fontSize: 16, marginTop: 24 }}>Contratos</h2>

      {erroContratos && (
        <p style={{ color: "#B0655C" }}>Erro ao carregar: {erroContratos.message}</p>
      )}

      <table style={{ width: "100%", marginTop: 8, borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
            <th style={{ padding: 8 }}>Contrato</th>
            <th style={{ padding: 8 }}>Coord.</th>
            <th style={{ padding: 8 }}>Valor global</th>
            <th style={{ padding: 8 }}>Vigência</th>
            <th style={{ padding: 8 }}>Etapa</th>
            <th style={{ padding: 8 }}>Situação</th>
          </tr>
        </thead>
        <tbody>
          {(contratos ?? []).map((c: any) => (
            <tr key={c.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: 8 }}>
                <Link href={`/processos/${c.id}`}>{c.numero_contrato}</Link>
              </td>
              <td style={{ padding: 8 }}>{c.coordenacoes?.sigla}</td>
              <td style={{ padding: 8 }}>{formatarValor(c.valor_global)}</td>
              <td style={{ padding: 8 }}>
                {formatarData(c.vigencia_inicio)} – {formatarData(c.vigencia_fim)}
              </td>
              <td style={{ padding: 8 }}>{c.etapa_atual}</td>
              <td style={{ padding: 8 }}>{c.situacao}</td>
            </tr>
          ))}
          {(contratos ?? []).length === 0 && (
            <tr>
              <td colSpan={6} style={{ padding: 8, color: "#7D7979" }}>
                Nenhum contrato para este fornecedor.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}
