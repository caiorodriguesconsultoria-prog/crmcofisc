"use client";

import Link from "next/link";

type Item = { id: string; nome: string; matricula: string | null; coordenacaoSigla: string };

export default function ListaPessoasPapel({
  titulo,
  novoHref,
  isAdmin,
  itens,
  erro,
}: {
  titulo: string;
  novoHref: string;
  isAdmin: boolean;
  itens: Item[];
  erro?: string;
}) {
  return (
    <main style={{ padding: 32 }}>
      <p>
        <Link href="/dashboard">← Voltar</Link>
      </p>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 12,
        }}
      >
        <h1 style={{ fontSize: 20 }}>{titulo}</h1>
        {isAdmin && <Link href={novoHref}>+ Cadastrar</Link>}
      </div>

      {erro && <p style={{ color: "#B0655C" }}>Erro ao carregar: {erro}</p>}

      <table style={{ width: "100%", marginTop: 16, borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
            <th style={{ padding: 8 }}>Nome</th>
            <th style={{ padding: 8 }}>Matrícula</th>
            <th style={{ padding: 8 }}>Coordenação</th>
          </tr>
        </thead>
        <tbody>
          {itens.map((i) => (
            <tr key={i.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: 8 }}>{i.nome}</td>
              <td style={{ padding: 8 }}>{i.matricula}</td>
              <td style={{ padding: 8 }}>{i.coordenacaoSigla}</td>
            </tr>
          ))}
          {itens.length === 0 && (
            <tr>
              <td colSpan={3} style={{ padding: 8, color: "#7D7979" }}>
                Nenhum cadastro ainda.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}
