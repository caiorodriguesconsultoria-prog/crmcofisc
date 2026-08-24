"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { card, cor } from "@/lib/theme";

type Processo = {
  id: string;
  numero_contrato: string;
  nup_principal: string;
  objeto: string;
  etapa_atual: string;
  coordenacao_id: string | null;
  coordenacoes: { sigla: string } | null;
  fornecedores: { nome: string } | null;
  forma_entrega_tag_id: string | null;
  responsavel_atual_id: string | null;
  responsavel: { nome: string } | null;
  processo_eletronico_numero: string | null;
  processo_tags: { tags: { id: string; valor: string } | null }[];
};

type Opcao = { id: string; nome?: string; sigla?: string; valor?: string };

export default function ListaProcessos({
  processos,
  coordenacoes,
  formasEntrega,
  eventos,
  responsaveis,
}: {
  processos: Processo[];
  coordenacoes: Opcao[];
  formasEntrega: Opcao[];
  eventos: Opcao[];
  responsaveis: Opcao[];
}) {
  const [coordenacaoId, setCoordenacaoId] = useState("");
  const [formaEntregaId, setFormaEntregaId] = useState("");
  const [eventoId, setEventoId] = useState("");
  const [responsavelId, setResponsavelId] = useState("");
  const [sei, setSei] = useState("");

  const filtrados = useMemo(() => {
    return processos.filter((p) => {
      if (coordenacaoId && p.coordenacao_id !== coordenacaoId) return false;
      if (formaEntregaId && p.forma_entrega_tag_id !== formaEntregaId) return false;
      if (eventoId && !p.processo_tags.some((pt) => pt.tags?.id === eventoId)) return false;
      if (responsavelId && p.responsavel_atual_id !== responsavelId) return false;
      if (sei === "com" && !p.processo_eletronico_numero) return false;
      if (sei === "sem" && p.processo_eletronico_numero) return false;
      return true;
    });
  }, [processos, coordenacaoId, formaEntregaId, eventoId, responsavelId, sei]);

  return (
    <div>
      <div
        style={{
          ...card,
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          marginTop: 16,
          padding: 14,
        }}
      >
        <select value={coordenacaoId} onChange={(e) => setCoordenacaoId(e.target.value)}>
          <option value="">Coordenação (todas)</option>
          {coordenacoes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.sigla}
            </option>
          ))}
        </select>
        <select value={formaEntregaId} onChange={(e) => setFormaEntregaId(e.target.value)}>
          <option value="">Forma de entrega (todas)</option>
          {formasEntrega.map((f) => (
            <option key={f.id} value={f.id}>
              {f.valor}
            </option>
          ))}
        </select>
        <select value={eventoId} onChange={(e) => setEventoId(e.target.value)}>
          <option value="">Evento (todos)</option>
          {eventos.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.valor}
            </option>
          ))}
        </select>
        <select value={responsavelId} onChange={(e) => setResponsavelId(e.target.value)}>
          <option value="">Responsável (todos)</option>
          {responsaveis.map((r) => (
            <option key={r.id} value={r.id}>
              {r.nome}
            </option>
          ))}
        </select>
        <select value={sei} onChange={(e) => setSei(e.target.value)}>
          <option value="">SEI (todos)</option>
          <option value="com">Com SEI</option>
          <option value="sem">Sem SEI</option>
        </select>
      </div>

      <p style={{ marginTop: 10, color: cor.textoTerciario, fontSize: 12.5 }}>
        {filtrados.length} de {processos.length} processos
      </p>

      <div style={{ ...card, padding: 0, overflow: "hidden", marginTop: 6 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: `1px solid ${cor.borda}` }}>
              <th style={{ padding: "10px 12px" }}>Contrato</th>
              <th style={{ padding: "10px 12px" }}>NUP</th>
              <th style={{ padding: "10px 12px" }}>Objeto</th>
              <th style={{ padding: "10px 12px" }}>Coord.</th>
              <th style={{ padding: "10px 12px" }}>Fornecedor</th>
              <th style={{ padding: "10px 12px" }}>Etapa</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((p) => (
              <tr key={p.id} style={{ borderBottom: `1px solid ${cor.borda}` }}>
                <td style={{ padding: "10px 12px" }}>
                  <Link href={`/processos/${p.id}`} style={{ fontWeight: 600, textDecoration: "none" }}>
                    {p.numero_contrato}
                  </Link>
                </td>
                <td style={{ padding: "10px 12px" }}>{p.nup_principal}</td>
                <td style={{ padding: "10px 12px" }}>{p.objeto}</td>
                <td style={{ padding: "10px 12px" }}>{p.coordenacoes?.sigla}</td>
                <td style={{ padding: "10px 12px" }}>{p.fornecedores?.nome}</td>
                <td style={{ padding: "10px 12px" }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: "3px 9px",
                      borderRadius: 20,
                      background: cor.destaqueFundo,
                      color: cor.destaque,
                    }}
                  >
                    {p.etapa_atual}
                  </span>
                </td>
              </tr>
            ))}
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: "10px 12px", color: cor.textoTerciario }}>
                  Nenhum processo encontrado com esses filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
