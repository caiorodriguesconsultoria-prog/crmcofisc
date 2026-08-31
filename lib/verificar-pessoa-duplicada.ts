import type { SupabaseClient } from "@supabase/supabase-js";

// Aviso não-bloqueante ao cadastrar gestor/fiscal — checa se já existe
// alguém com o mesmo nome (comparação sem diferenciar maiúscula/minúscula)
// ou a mesma matrícula, pra evitar cadastro duplicado por engano.
export async function verificarPessoaDuplicada(
  supabase: SupabaseClient,
  nome: string,
  matricula: string,
): Promise<string | null> {
  const nomeAparado = nome.trim();
  const matriculaAparada = matricula.trim();
  if (!nomeAparado && !matriculaAparada) return null;

  const condicoes: string[] = [];
  if (nomeAparado) condicoes.push(`nome.ilike.${nomeAparado}`);
  if (matriculaAparada) condicoes.push(`matricula.eq.${matriculaAparada}`);

  const { data } = await supabase.from("pessoas").select("nome, matricula").or(condicoes.join(",")).limit(1);
  if (!data || data.length === 0) return null;

  const p = data[0] as { nome: string; matricula: string | null };
  return `Já existe um cadastro parecido: ${p.nome}${p.matricula ? ` (matrícula ${p.matricula})` : ""}.`;
}
