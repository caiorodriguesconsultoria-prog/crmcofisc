import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function CoordenacoesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: pessoa }, { data: coordenacoes, error }] = await Promise.all([
    supabase.from("pessoas").select("is_admin").eq("auth_user_id", user.id).maybeSingle(),
    supabase.from("coordenacoes").select("id, sigla, nome, email_generico").order("sigla"),
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
        <h1 style={{ fontSize: 20 }}>Coordenações</h1>
        {isAdmin && <Link href="/coordenacoes/novo">+ Nova coordenação</Link>}
      </div>

      {error && <p style={{ color: "#B0655C" }}>Erro ao carregar: {error.message}</p>}

      <table style={{ width: "100%", marginTop: 16, borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
            <th style={{ padding: 8 }}>Sigla</th>
            <th style={{ padding: 8 }}>Nome</th>
            <th style={{ padding: 8 }}>E-mail genérico</th>
          </tr>
        </thead>
        <tbody>
          {(coordenacoes ?? []).map((c) => (
            <tr key={c.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: 8 }}>{c.sigla}</td>
              <td style={{ padding: 8 }}>{c.nome}</td>
              <td style={{ padding: 8 }}>{c.email_generico}</td>
            </tr>
          ))}
          {(coordenacoes ?? []).length === 0 && (
            <tr>
              <td colSpan={3} style={{ padding: 8, color: "#7D7979" }}>
                Nenhuma coordenação cadastrada.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}
