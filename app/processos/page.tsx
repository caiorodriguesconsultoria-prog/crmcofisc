import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ProcessosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: processos, error } = await supabase
    .from("processos")
    .select(
      "id, numero_contrato, nup_principal, objeto, etapa_atual, coordenacoes(sigla), fornecedores(nome)",
    )
    .order("created_at", { ascending: false });

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
        <h1 style={{ fontSize: 20 }}>Processos</h1>
        <Link href="/processos/novo">+ Novo processo</Link>
      </div>

      {error && <p style={{ color: "#B0655C" }}>Erro ao carregar: {error.message}</p>}

      <table style={{ width: "100%", marginTop: 16, borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
            <th style={{ padding: 8 }}>Contrato</th>
            <th style={{ padding: 8 }}>NUP</th>
            <th style={{ padding: 8 }}>Objeto</th>
            <th style={{ padding: 8 }}>Coord.</th>
            <th style={{ padding: 8 }}>Fornecedor</th>
            <th style={{ padding: 8 }}>Etapa</th>
          </tr>
        </thead>
        <tbody>
          {(processos ?? []).map((p: any) => (
            <tr key={p.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: 8 }}>
                <Link href={`/processos/${p.id}`}>{p.numero_contrato}</Link>
              </td>
              <td style={{ padding: 8 }}>{p.nup_principal}</td>
              <td style={{ padding: 8 }}>{p.objeto}</td>
              <td style={{ padding: 8 }}>{p.coordenacoes?.sigla}</td>
              <td style={{ padding: 8 }}>{p.fornecedores?.nome}</td>
              <td style={{ padding: 8 }}>{p.etapa_atual}</td>
            </tr>
          ))}
          {(processos ?? []).length === 0 && (
            <tr>
              <td colSpan={6} style={{ padding: 8, color: "#7D7979" }}>
                Nenhum processo cadastrado.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}
