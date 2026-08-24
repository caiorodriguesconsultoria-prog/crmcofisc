import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NovoFornecedorForm from "./form";
import { card } from "@/lib/theme";

export default async function NovoFornecedorPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: pessoa } = await supabase
    .from("pessoas")
    .select("is_admin")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!pessoa?.is_admin) {
    redirect("/fornecedores");
  }

  return (
    <main style={{ padding: 32, maxWidth: 480, margin: "0 auto" }}>
      <h1 style={{ fontSize: 20, marginBottom: 16 }}>Novo fornecedor</h1>
      <div style={card}>
        <NovoFornecedorForm />
      </div>
    </main>
  );
}
