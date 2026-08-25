"use client";

import Link from "next/link";
import { botaoPrimario, card, cor } from "@/lib/theme";
import { BotaoCopiar } from "@/app/_ui/campo";
import Painel from "@/app/_ui/painel";

type Item = { id: string; nome: string; matricula: string | null; ramal: string | null };

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
    <Painel
      titulo={titulo}
      voltarHref="/dashboard"
      maxWidth={900}
      acao={
        isAdmin && (
          <Link href={novoHref} style={{ ...botaoPrimario, textDecoration: "none" }}>
            + Cadastrar
          </Link>
        )
      }
    >
      {erro && <p style={{ color: cor.urgente }}>Erro ao carregar: {erro}</p>}

      <div style={{ ...card, padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: `1px solid ${cor.borda}` }}>
              <th style={{ padding: "10px 12px" }}>Nome</th>
              <th style={{ padding: "10px 12px" }}>Matrícula</th>
              <th style={{ padding: "10px 12px" }}>Ramal</th>
              <th style={{ padding: "10px 12px" }}></th>
            </tr>
          </thead>
          <tbody>
            {itens.map((i) => (
              <tr key={i.id} style={{ borderBottom: `1px solid ${cor.borda}` }}>
                <td style={{ padding: "10px 12px", fontWeight: 600 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {i.nome}
                    <BotaoCopiar texto={i.nome} />
                  </div>
                </td>
                <td style={{ padding: "10px 12px" }}>
                  {i.matricula && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {i.matricula}
                      <BotaoCopiar texto={i.matricula} />
                    </div>
                  )}
                </td>
                <td style={{ padding: "10px 12px" }}>
                  {i.ramal && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {i.ramal}
                      <BotaoCopiar texto={i.ramal} />
                    </div>
                  )}
                </td>
                <td style={{ padding: "10px 12px" }}>
                  {i.matricula && (
                    <BotaoCopiar texto={`${i.nome}, matrícula SIAPE nº ${i.matricula}`} rotulo="Copiar nome + matrícula" />
                  )}
                </td>
              </tr>
            ))}
            {itens.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: "10px 12px", color: cor.textoTerciario }}>
                  Nenhum cadastro ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Painel>
  );
}
