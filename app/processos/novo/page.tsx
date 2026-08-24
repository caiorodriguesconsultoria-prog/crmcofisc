import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NovoProcessoForm from "./form";
import { cor } from "@/lib/theme";
import Painel from "@/app/_ui/painel";
import { getPessoasAtivas, getPapeisGestorFiscal } from "@/lib/dados-referencia";

export default async function NovoProcessoPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  if (!user) {
    redirect("/login");
  }

  const [
    { data: coordenacoes, error: erroCoordenacoes },
    { data: fornecedores, error: erroFornecedores },
    { data: tags, error: erroTags },
    pessoas,
    papeis,
  ] = await Promise.all([
    supabase.from("coordenacoes").select("id, sigla").order("sigla"),
    supabase.from("fornecedores").select("id, nome").order("nome"),
    supabase.from("tags").select("id, categoria, valor").eq("ativo", true).order("valor"),
    getPessoasAtivas(),
    getPapeisGestorFiscal(),
  ]);

  const erros = [
    erroCoordenacoes && `coordenações: ${erroCoordenacoes.message}`,
    erroFornecedores && `fornecedores: ${erroFornecedores.message}`,
    erroTags && `tags: ${erroTags.message}`,
  ].filter(Boolean);

  const gestores = (papeis ?? [])
    .filter((p) => p.papel === "gestor")
    .map((p: any) => ({ id: p.pessoa_id, nome: p.pessoas?.nome ?? "" }));
  const fiscais = (papeis ?? [])
    .filter((p) => p.papel === "fiscal")
    .map((p: any) => ({ id: p.pessoa_id, nome: p.pessoas?.nome ?? "" }));

  return (
    <Painel titulo="Novo processo" voltarHref="/processos" maxWidth={480}>
      {erros.length > 0 && (
        <p style={{ color: cor.urgente }}>Erro ao carregar opções — {erros.join("; ")}</p>
      )}
      <NovoProcessoForm
        coordenacoes={coordenacoes ?? []}
        fornecedores={fornecedores ?? []}
        tags={tags ?? []}
        pessoas={pessoas ?? []}
        gestores={gestores}
        fiscais={fiscais}
      />
    </Painel>
  );
}
