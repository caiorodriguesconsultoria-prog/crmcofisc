import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { botaoPrimario, cor } from "@/lib/theme";
import GradeCoordenacoes from "./grade";

export default async function CoordenacoesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: pessoa }, { data: coordenacoes, error }, { data: papeis }] = await Promise.all([
    supabase.from("pessoas").select("is_admin").eq("auth_user_id", user.id).maybeSingle(),
    supabase.from("coordenacoes").select("id, sigla, nome, email_generico, telefone").order("sigla"),
    supabase
      .from("pessoa_papeis")
      .select("id, coordenacao_id, papel, pessoas(id, nome, email, ramal)")
      .in("papel", ["coordenador", "substituto"]),
  ]);

  const isAdmin = pessoa?.is_admin ?? false;

  const grade = (coordenacoes ?? []).map((c) => ({
    id: c.id,
    sigla: c.sigla,
    nome: c.nome,
    emailGenerico: c.email_generico,
    telefone: c.telefone,
    responsaveis: (papeis ?? [])
      .filter((pp) => pp.coordenacao_id === c.id)
      .map((pp: any) => ({
        papelId: pp.id,
        id: pp.pessoas?.id ?? pp.id,
        nome: pp.pessoas?.nome ?? "",
        email: pp.pessoas?.email ?? null,
        ramal: pp.pessoas?.ramal ?? null,
        papel: pp.papel as "coordenador" | "substituto",
      })),
  }));

  return (
    <main style={{ padding: 32, maxWidth: 1100, margin: "0 auto" }}>
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
      <p style={{ color: cor.textoTerciario, fontSize: 13, marginTop: 2 }}>
        Responsáveis, e-mails e ramais usados nas notificações do processo.
      </p>

      {error && <p style={{ color: cor.urgente }}>Erro ao carregar: {error.message}</p>}

      <GradeCoordenacoes coordenacoes={grade} isAdmin={isAdmin} />
    </main>
  );
}
