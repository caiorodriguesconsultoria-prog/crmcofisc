import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Contatos from "./contatos";
import { card, cor } from "@/lib/theme";

export default async function CoordenacaoPage({
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

  const [{ data: pessoa }, { data: coordenacao, error }, { data: contatos }] = await Promise.all([
    supabase.from("pessoas").select("is_admin").eq("auth_user_id", user.id).maybeSingle(),
    supabase.from("coordenacoes").select("id, sigla, nome, email_generico").eq("id", id).single(),
    supabase
      .from("coordenacao_contatos")
      .select("id, nome, email, ramal")
      .eq("coordenacao_id", id)
      .order("nome"),
  ]);

  if (error || !coordenacao) {
    notFound();
  }

  return (
    <main style={{ padding: 32, maxWidth: 700, margin: "0 auto" }}>
      <p>
        <Link href="/coordenacoes">← Voltar</Link>
      </p>
      <div style={{ ...card, marginTop: 12 }}>
        <h1 style={{ fontSize: 20, margin: 0 }}>
          {coordenacao.sigla} — {coordenacao.nome}
        </h1>
        {coordenacao.email_generico && (
          <p style={{ color: cor.textoSecundario, margin: "4px 0 0", fontSize: 13 }}>
            E-mail genérico: {coordenacao.email_generico}
          </p>
        )}
      </div>

      <Contatos
        coordenacaoId={id}
        coordenacaoLabel={`${coordenacao.nome} (${coordenacao.sigla})`}
        isAdmin={pessoa?.is_admin ?? false}
        contatos={(contatos ?? []) as any}
      />
    </main>
  );
}
