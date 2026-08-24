import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ListaProcessos from "./lista";
import { botaoPrimario, cor } from "@/lib/theme";

export default async function ProcessosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [
    { data: processos, error },
    { data: coordenacoes },
    { data: formasEntrega },
    { data: eventos },
    { data: responsaveis },
  ] = await Promise.all([
    supabase
      .from("processos")
      .select(
        "id, numero_contrato, nup_principal, objeto, etapa_atual, coordenacao_id, coordenacoes(sigla), fornecedores(nome), forma_entrega_tag_id, responsavel_atual_id, responsavel:pessoas!processos_responsavel_atual_id_fkey(nome), processo_eletronico_numero, processo_tags(tags(id, valor))",
      )
      .order("created_at", { ascending: false }),
    supabase.from("coordenacoes").select("id, sigla").order("sigla"),
    supabase.from("tags").select("id, valor").eq("categoria", "forma_entrega").eq("ativo", true).order("valor"),
    supabase.from("tags").select("id, valor").eq("categoria", "evento").eq("ativo", true).order("valor"),
    supabase.from("pessoas").select("id, nome").eq("ativo", true).order("nome"),
  ]);

  return (
    <main style={{ padding: 32, maxWidth: 1100, margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <h1 style={{ fontSize: 20 }}>Processos</h1>
        <Link href="/processos/novo" style={{ ...botaoPrimario, textDecoration: "none" }}>
          + Novo processo
        </Link>
      </div>

      {error && <p style={{ color: cor.urgente }}>Erro ao carregar: {error.message}</p>}

      <ListaProcessos
        processos={(processos ?? []) as any}
        coordenacoes={coordenacoes ?? []}
        formasEntrega={formasEntrega ?? []}
        eventos={eventos ?? []}
        responsaveis={responsaveis ?? []}
      />
    </main>
  );
}
