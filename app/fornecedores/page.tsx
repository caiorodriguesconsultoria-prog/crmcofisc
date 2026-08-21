import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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
    <main style={{ padding: 32 }}>
      <p>
        <Link href="/dashboard">← Voltar</Link>
      </p>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 12,
        }}
      >
        <h1 style={{ fontSize: 20 }}>Fornecedores</h1>
        {isAdmin && <Link href="/fornecedores/novo">+ Novo fornecedor</Link>}
      </div>

      {error && <p style={{ color: "#B0655C" }}>Erro ao carregar: {error.message}</p>}

      <table style={{ width: "100%", marginTop: 16, borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
            <th style={{ padding: 8 }}>Nome</th>
            <th style={{ padding: 8 }}>CNPJ</th>
            <th style={{ padding: 8 }}>Preposto</th>
            <th style={{ padding: 8 }}>Telefone</th>
            <th style={{ padding: 8 }}>E-mails</th>
          </tr>
        </thead>
        <tbody>
          {(fornecedores ?? []).map((f) => (
            <tr key={f.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: 8 }}>
                <Link href={`/fornecedores/${f.id}`}>{f.nome}</Link>
              </td>
              <td style={{ padding: 8 }}>{f.cnpj}</td>
              <td style={{ padding: 8 }}>{f.preposto}</td>
              <td style={{ padding: 8 }}>{f.telefone}</td>
              <td style={{ padding: 8 }}>
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
              <td colSpan={5} style={{ padding: 8, color: "#7D7979" }}>
                Nenhum fornecedor cadastrado.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}
