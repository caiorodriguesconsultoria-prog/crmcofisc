"use client";

import Link from "next/link";
import { botaoPrimario, card, cor } from "@/lib/theme";

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
    <main style={{ padding: 32, maxWidth: 900, margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <h1 style={{ fontSize: 20 }}>{titulo}</h1>
        {isAdmin && (
          <Link href={novoHref} style={{ ...botaoPrimario, textDecoration: "none" }}>
            + Cadastrar
          </Link>
        )}
      </div>

      {erro && <p style={{ color: cor.urgente }}>Erro ao carregar: {erro}</p>}

      <div style={{ ...card, padding: 0, overflow: "hidden", marginTop: 16 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: `1px solid ${cor.borda}` }}>
              <th style={{ padding: "10px 12px" }}>Nome</th>
              <th style={{ padding: "10px 12px" }}>Matrícula</th>
              <th style={{ padding: "10px 12px" }}>Coordenação</th>
            </tr>
          </thead>
          <tbody>
            {itens.map((i) => (
              <tr key={i.id} style={{ borderBottom: `1px solid ${cor.borda}` }}>
                <td style={{ padding: "10px 12px", fontWeight: 600 }}>{i.nome}</td>
                <td style={{ padding: "10px 12px" }}>{i.matricula}</td>
                <td style={{ padding: "10px 12px" }}>{i.coordenacaoSigla}</td>
              </tr>
            ))}
            {itens.length === 0 && (
              <tr>
                <td colSpan={3} style={{ padding: "10px 12px", color: cor.textoTerciario }}>
                  Nenhum cadastro ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
