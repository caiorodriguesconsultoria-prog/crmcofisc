import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { botaoPrimario, card, cor } from "@/lib/theme";

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
    <main style={{ padding: 32, maxWidth: 900, margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <h1 style={{ fontSize: 20 }}>Coordenações</h1>
        {isAdmin && (
          <Link href="/coordenacoes/novo" style={{ ...botaoPrimario, textDecoration: "none" }}>
            + Nova coordenação
          </Link>
        )}
      </div>

      {error && <p style={{ color: cor.urgente }}>Erro ao carregar: {error.message}</p>}

      <div style={{ ...card, padding: 0, overflow: "hidden", marginTop: 16 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: `1px solid ${cor.borda}` }}>
              <th style={{ padding: "10px 12px" }}>Sigla</th>
              <th style={{ padding: "10px 12px" }}>Nome</th>
              <th style={{ padding: "10px 12px" }}>E-mail genérico</th>
            </tr>
          </thead>
          <tbody>
            {(coordenacoes ?? []).map((c) => (
              <tr key={c.id} style={{ borderBottom: `1px solid ${cor.borda}` }}>
                <td style={{ padding: "10px 12px", fontWeight: 600 }}>
                  <Link href={`/coordenacoes/${c.id}`} style={{ textDecoration: "none" }}>
                    {c.sigla}
                  </Link>
                </td>
                <td style={{ padding: "10px 12px" }}>{c.nome}</td>
                <td style={{ padding: "10px 12px" }}>{c.email_generico}</td>
              </tr>
            ))}
            {(coordenacoes ?? []).length === 0 && (
              <tr>
                <td colSpan={3} style={{ padding: "10px 12px", color: cor.textoTerciario }}>
                  Nenhuma coordenação cadastrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
