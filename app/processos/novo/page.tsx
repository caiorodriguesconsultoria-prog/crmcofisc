import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NovoProcessoForm from "./form";
import { card, cor } from "@/lib/theme";

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
    { data: papeis, error: erroPapeis },
  ] = await Promise.all([
    supabase.from("coordenacoes").select("id, sigla").order("sigla"),
    supabase.from("fornecedores").select("id, nome").order("nome"),
    supabase.from("tags").select("id, categoria, valor").eq("ativo", true).order("valor"),
    supabase.from("pessoas").select("id, nome").eq("ativo", true).order("nome"),
    supabase
      .from("pessoa_papeis")
      .select("pessoa_id, coordenacao_id, papel, pessoas(nome)")
      .in("papel", ["gestor", "fiscal"]),
  ]);

  const erros = [
    erroCoordenacoes && `coordenações: ${erroCoordenacoes.message}`,
    erroFornecedores && `fornecedores: ${erroFornecedores.message}`,
    erroTags && `tags: ${erroTags.message}`,
    erroPessoas && `pessoas: ${erroPessoas.message}`,
    erroPapeis && `gestores/fiscais: ${erroPapeis.message}`,
  ].filter(Boolean);

  const gestores = (papeis ?? [])
    .filter((p) => p.papel === "gestor")
    .map((p: any) => ({ id: p.pessoa_id, nome: p.pessoas?.nome ?? "", coordenacaoId: p.coordenacao_id }));
  const fiscais = (papeis ?? [])
    .filter((p) => p.papel === "fiscal")
    .map((p: any) => ({ id: p.pessoa_id, nome: p.pessoas?.nome ?? "", coordenacaoId: p.coordenacao_id }));

  return (
    <main style={{ padding: 32, maxWidth: 480, margin: "0 auto" }}>
      <h1 style={{ fontSize: 20, marginBottom: 16 }}>Novo processo</h1>
      {erros.length > 0 && (
        <p style={{ color: cor.urgente }}>Erro ao carregar opções — {erros.join("; ")}</p>
      )}
      <div style={card}>
        <NovoProcessoForm
          coordenacoes={coordenacoes ?? []}
          fornecedores={fornecedores ?? []}
          tags={tags ?? []}
          pessoas={pessoas ?? []}
          gestores={gestores}
          fiscais={fiscais}
        />
      </div>
    </main>
  );
}
