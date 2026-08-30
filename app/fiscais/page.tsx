import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ListaPessoasPapel from "../_pessoas-papel/lista";

export default async function FiscaisPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  if (!user) {
    redirect("/login");
  }

  const [{ data: pessoa }, { data: papeis, error }] = await Promise.all([
    supabase.from("pessoas").select("is_admin").eq("auth_user_id", user.id).maybeSingle(),
    supabase
      .from("pessoa_papeis")
      .select("pessoa_id, pessoas(id, nome, matricula, ramal)")
      .eq("papel", "fiscal"),
  ]);

  const itens = (papeis ?? [])
    .map((p: any) => ({
      id: p.pessoas?.id ?? p.pessoa_id,
      nome: p.pessoas?.nome ?? "",
      matricula: p.pessoas?.matricula ?? null,
      ramal: p.pessoas?.ramal ?? null,
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome));

  return (
    <ListaPessoasPapel
      titulo="Fiscais"
      papel="fiscal"
      novoHref="/fiscais/novo"
      isAdmin={pessoa?.is_admin ?? false}
      itens={itens}
      erro={error?.message}
    />
  );
}
