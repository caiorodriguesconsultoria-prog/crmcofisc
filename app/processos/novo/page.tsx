import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NovoProcessoForm from "./form";

export default async function NovoProcessoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [
    { data: coordenacoes, error: erroCoordenacoes },
    { data: fornecedores, error: erroFornecedores },
    { data: tags, error: erroTags },
    { data: pessoas, error: erroPessoas },
  ] = await Promise.all([
    supabase.from("coordenacoes").select("id, sigla").order("sigla"),
    supabase.from("fornecedores").select("id, nome").order("nome"),
    supabase.from("tags").select("id, categoria, valor").eq("ativo", true).order("valor"),
    supabase.from("pessoas").select("id, nome").eq("ativo", true).order("nome"),
  ]);

  const erros = [
    erroCoordenacoes && `coordenações: ${erroCoordenacoes.message}`,
    erroFornecedores && `fornecedores: ${erroFornecedores.message}`,
    erroTags && `tags: ${erroTags.message}`,
    erroPessoas && `pessoas: ${erroPessoas.message}`,
  ].filter(Boolean);

  return (
    <main style={{ padding: 32, maxWidth: 480 }}>
      <h1 style={{ fontSize: 20, marginBottom: 16 }}>Novo processo</h1>
      {erros.length > 0 && (
        <p style={{ color: "#B0655C" }}>Erro ao carregar opções — {erros.join("; ")}</p>
      )}
      <NovoProcessoForm
        coordenacoes={coordenacoes ?? []}
        fornecedores={fornecedores ?? []}
        tags={tags ?? []}
        pessoas={pessoas ?? []}
      />
    </main>
  );
}
