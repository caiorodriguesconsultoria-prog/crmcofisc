import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { count, error } = await supabase
    .from("processos")
    .select("*", { count: "exact", head: true });

  return (
    <main style={{ padding: 32 }}>
      <h1 style={{ fontSize: 20 }}>CRM-COFISC</h1>
      <p>Logado como {user.email}</p>
      <p>
        Processos cadastrados:{" "}
        {error ? `erro ao consultar (${error.message})` : count}
      </p>
      <p>
        <Link href="/processos">Ver processos →</Link>
      </p>
      <p>
        <Link href="/fornecedores">Ver fornecedores →</Link>
      </p>
      <form action="/logout" method="post">
        <button type="submit">Sair</button>
      </form>
    </main>
  );
}
