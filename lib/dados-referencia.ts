import { unstable_cache } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";

// Listas de referência (pouco mutáveis, iguais pra qualquer usuário autenticado)
// cacheadas por 1 min pra evitar reconsultar o banco a cada navegação.
// Usa o client de serviço (bypassa RLS) porque unstable_cache não pode depender
// de cookies() por requisição — seguro aqui porque toda página que chama essas
// funções já verificou sessão antes, e o dado não é sensível por usuário.

export const getPessoasAtivas = unstable_cache(
  async () => {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from("pessoas")
      .select("id, nome")
      .eq("ativo", true)
      .order("nome");
    return data ?? [];
  },
  ["ref-pessoas-ativas"],
  { revalidate: 60 },
);

export const getPapeisGestorFiscal = unstable_cache(
  async () => {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from("pessoa_papeis")
      .select("pessoa_id, papel, pessoas(nome)")
      .in("papel", ["gestor", "fiscal"]);
    return data ?? [];
  },
  ["ref-papeis-gestor-fiscal"],
  { revalidate: 60 },
);

export const getTagsEvento = unstable_cache(
  async () => {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from("tags")
      .select("id, valor")
      .eq("categoria", "evento")
      .eq("ativo", true)
      .order("valor");
    return data ?? [];
  },
  ["ref-tags-evento"],
  { revalidate: 60 },
);
