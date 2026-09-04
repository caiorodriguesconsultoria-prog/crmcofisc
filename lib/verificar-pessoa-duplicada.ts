import type { SupabaseClient } from "@supabase/supabase-js";

export type PessoaEncontrada = { id: string; nome: string; matricula: string | null };

// Acha uma pessoa já cadastrada com o mesmo nome (sem diferenciar
// maiúscula/minúscula) ou a mesma matrícula — usado tanto pra avisar antes
// de tentar criar quanto, na hora de criar de verdade, pra reaproveitar o
// cadastro em vez de tentar inserir de novo (o que falha, já que matrícula
// é única) e a pessoa nunca aparecer na lista do papel que faltava.
export async function buscarPessoaDuplicada(
  supabase: SupabaseClient,
  nome: string,
  matricula: string,
): Promise<PessoaEncontrada | null> {
  const nomeAparado = nome.trim();
  const matriculaAparada = matricula.trim();
  if (!nomeAparado && !matriculaAparada) return null;

  const condicoes: string[] = [];
  if (nomeAparado) condicoes.push(`nome.ilike.${nomeAparado}`);
  if (matriculaAparada) condicoes.push(`matricula.eq.${matriculaAparada}`);

  const { data } = await supabase.from("pessoas").select("id, nome, matricula").or(condicoes.join(",")).limit(1);
  if (!data || data.length === 0) return null;
  return data[0] as PessoaEncontrada;
}

export async function verificarPessoaDuplicada(
  supabase: SupabaseClient,
  nome: string,
  matricula: string,
): Promise<string | null> {
  const p = await buscarPessoaDuplicada(supabase, nome, matricula);
  if (!p) return null;
  return `Já existe um cadastro parecido: ${p.nome}${p.matricula ? ` (matrícula ${p.matricula})` : ""}. Ao criar, esse cadastro será reaproveitado (só adiciona o papel que falta).`;
}

// Garante que uma pessoa (nova ou já existente) tenha o papel indicado —
// reaproveita o cadastro por nome/matrícula em vez de tentar inserir de
// novo em pessoas (que falharia pela matrícula ser única). Devolve o id e
// nome finais, pra selecionar na lista logo em seguida.
export async function garantirPessoaComPapel(
  supabase: SupabaseClient,
  nome: string,
  matricula: string,
  papel: "gestor" | "fiscal" | "responsavel",
): Promise<{ id: string; nome: string } | { erro: string }> {
  const encontrada = await buscarPessoaDuplicada(supabase, nome, matricula);

  let pessoaId: string;
  let nomeFinal: string;

  if (encontrada) {
    pessoaId = encontrada.id;
    nomeFinal = encontrada.nome;
  } else {
    const insercao: { nome: string; matricula?: string } = { nome: nome.trim() };
    if (matricula.trim()) insercao.matricula = matricula.trim();
    const { data: pessoa, error: erroPessoa } = await supabase
      .from("pessoas")
      .insert(insercao)
      .select("id, nome")
      .single();
    if (erroPessoa || !pessoa) return { erro: erroPessoa?.message ?? "Erro ao criar cadastro." };
    pessoaId = pessoa.id;
    nomeFinal = pessoa.nome;
  }

  const { data: jaTemPapel } = await supabase
    .from("pessoa_papeis")
    .select("pessoa_id")
    .eq("pessoa_id", pessoaId)
    .eq("papel", papel)
    .maybeSingle();

  if (!jaTemPapel) {
    const { error: erroPapel } = await supabase.from("pessoa_papeis").insert({ pessoa_id: pessoaId, papel });
    if (erroPapel) return { erro: erroPapel.message };
  }

  return { id: pessoaId, nome: nomeFinal };
}
