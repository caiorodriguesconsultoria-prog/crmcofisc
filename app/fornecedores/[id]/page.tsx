import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { card, cor } from "@/lib/theme";
import Painel from "@/app/_ui/painel";

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
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

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
    <Painel titulo={fornecedor.nome} voltarHref="/fornecedores" maxWidth={800}>
      <div style={{ ...card, display: "flex", flexDirection: "column", gap: 4 }}>
        <p style={{ color: cor.textoSecundario, margin: 0, fontSize: 13 }}>{fornecedor.cnpj}</p>
        <p style={{ margin: 0, fontSize: 13 }}>
          Preposto: {fornecedor.preposto || "—"} · Telefone: {fornecedor.telefone || "—"}
        </p>
        <p style={{ margin: 0, fontSize: 13 }}>
          E-mails:{" "}
          {(fornecedor.fornecedor_emails ?? [])
            .map((e: { email: string; rotulo: string | null }) =>
              e.rotulo ? `${e.email} (${e.rotulo})` : e.email,
            )
            .join(", ") || "—"}
        </p>
        {fornecedor.endereco && <p style={{ margin: 0, fontSize: 13 }}>Endereço: {fornecedor.endereco}</p>}
      </div>

      <h2 style={{ fontSize: 16, marginTop: 24 }}>Contratos</h2>

      {erroContratos && (
        <p style={{ color: cor.urgente }}>Erro ao carregar: {erroContratos.message}</p>
      )}

      <div style={{ ...card, padding: 0, overflow: "hidden", marginTop: 8 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: `1px solid ${cor.borda}` }}>
              <th style={{ padding: "10px 12px" }}>Contrato</th>
              <th style={{ padding: "10px 12px" }}>Coord.</th>
              <th style={{ padding: "10px 12px" }}>Valor global</th>
              <th style={{ padding: "10px 12px" }}>Vigência</th>
              <th style={{ padding: "10px 12px" }}>Etapa</th>
              <th style={{ padding: "10px 12px" }}>Situação</th>
            </tr>
          </thead>
          <tbody>
            {(contratos ?? []).map((c: any) => (
              <tr key={c.id} style={{ borderBottom: `1px solid ${cor.borda}` }}>
                <td style={{ padding: "10px 12px" }}>
                  <Link href={`/processos/${c.id}`} style={{ fontWeight: 600, textDecoration: "none" }}>
                    {c.numero_contrato}
                  </Link>
                </td>
                <td style={{ padding: "10px 12px" }}>{c.coordenacoes?.sigla}</td>
                <td style={{ padding: "10px 12px" }}>{formatarValor(c.valor_global)}</td>
                <td style={{ padding: "10px 12px" }}>
                  {formatarData(c.vigencia_inicio)} – {formatarData(c.vigencia_fim)}
                </td>
                <td style={{ padding: "10px 12px" }}>{c.etapa_atual}</td>
                <td style={{ padding: "10px 12px" }}>{c.situacao}</td>
              </tr>
            ))}
            {(contratos ?? []).length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: "10px 12px", color: cor.textoTerciario }}>
                  Nenhum contrato para este fornecedor.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Painel>
  );
}
