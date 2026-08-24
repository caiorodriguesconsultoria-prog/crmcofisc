import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { botaoPrimario, card, cor } from "@/lib/theme";
import Painel from "@/app/_ui/painel";

export default async function FornecedoresPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: pessoa }, { data: fornecedores, error }] = await Promise.all([
    supabase.from("pessoas").select("is_admin").eq("auth_user_id", user.id).maybeSingle(),
    supabase
      .from("fornecedores")
      .select("id, nome, cnpj, preposto, telefone, fornecedor_emails(email, rotulo)")
      .order("nome"),
  ]);

  const isAdmin = pessoa?.is_admin ?? false;

  return (
    <Painel
      titulo="Fornecedores"
      voltarHref="/dashboard"
      maxWidth={1000}
      acao={
        isAdmin && (
          <Link href="/fornecedores/novo" style={{ ...botaoPrimario, textDecoration: "none" }}>
            + Novo fornecedor
          </Link>
        )
      }
    >
      {error && <p style={{ color: cor.urgente }}>Erro ao carregar: {error.message}</p>}

      <div style={{ ...card, padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: `1px solid ${cor.borda}` }}>
              <th style={{ padding: "10px 12px" }}>Nome</th>
              <th style={{ padding: "10px 12px" }}>CNPJ</th>
              <th style={{ padding: "10px 12px" }}>Preposto</th>
              <th style={{ padding: "10px 12px" }}>Telefone</th>
              <th style={{ padding: "10px 12px" }}>E-mails</th>
            </tr>
          </thead>
          <tbody>
            {(fornecedores ?? []).map((f) => (
              <tr key={f.id} style={{ borderBottom: `1px solid ${cor.borda}` }}>
                <td style={{ padding: "10px 12px" }}>
                  <Link href={`/fornecedores/${f.id}`} style={{ fontWeight: 600, textDecoration: "none" }}>
                    {f.nome}
                  </Link>
                </td>
                <td style={{ padding: "10px 12px" }}>{f.cnpj}</td>
                <td style={{ padding: "10px 12px" }}>{f.preposto}</td>
                <td style={{ padding: "10px 12px" }}>{f.telefone}</td>
                <td style={{ padding: "10px 12px" }}>
                  {(f.fornecedor_emails ?? [])
                    .map((e: { email: string; rotulo: string | null }) =>
                      e.rotulo ? `${e.email} (${e.rotulo})` : e.email,
                    )
                    .join(", ")}
                </td>
              </tr>
            ))}
            {(fornecedores ?? []).length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: "10px 12px", color: cor.textoTerciario }}>
                  Nenhum fornecedor cadastrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Painel>
  );
}
