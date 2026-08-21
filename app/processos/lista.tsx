"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

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
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          marginTop: 16,
          padding: 12,
          background: "#F5F4F3",
        }}
      >
        <select value={coordenacaoId} onChange={(e) => setCoordenacaoId(e.target.value)} style={{ padding: 6 }}>
          <option value="">Coordenação (todas)</option>
          {coordenacoes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.sigla}
            </option>
          ))}
        </select>
        <select value={formaEntregaId} onChange={(e) => setFormaEntregaId(e.target.value)} style={{ padding: 6 }}>
          <option value="">Forma de entrega (todas)</option>
          {formasEntrega.map((f) => (
            <option key={f.id} value={f.id}>
              {f.valor}
            </option>
          ))}
        </select>
        <select value={eventoId} onChange={(e) => setEventoId(e.target.value)} style={{ padding: 6 }}>
          <option value="">Evento (todos)</option>
          {eventos.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.valor}
            </option>
          ))}
        </select>
        <select value={responsavelId} onChange={(e) => setResponsavelId(e.target.value)} style={{ padding: 6 }}>
          <option value="">Responsável (todos)</option>
          {responsaveis.map((r) => (
            <option key={r.id} value={r.id}>
              {r.nome}
            </option>
          ))}
        </select>
        <select value={sei} onChange={(e) => setSei(e.target.value)} style={{ padding: 6 }}>
          <option value="">SEI (todos)</option>
          <option value="com">Com SEI</option>
          <option value="sem">Sem SEI</option>
        </select>
      </div>

      <p style={{ marginTop: 8, color: "#7D7979", fontSize: 13 }}>
        {filtrados.length} de {processos.length} processos
      </p>

      <table style={{ width: "100%", marginTop: 8, borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
            <th style={{ padding: 8 }}>Contrato</th>
            <th style={{ padding: 8 }}>NUP</th>
            <th style={{ padding: 8 }}>Objeto</th>
            <th style={{ padding: 8 }}>Coord.</th>
            <th style={{ padding: 8 }}>Fornecedor</th>
            <th style={{ padding: 8 }}>Etapa</th>
          </tr>
        </thead>
        <tbody>
          {filtrados.map((p) => (
            <tr key={p.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: 8 }}>
                <Link href={`/processos/${p.id}`}>{p.numero_contrato}</Link>
              </td>
              <td style={{ padding: 8 }}>{p.nup_principal}</td>
              <td style={{ padding: 8 }}>{p.objeto}</td>
              <td style={{ padding: 8 }}>{p.coordenacoes?.sigla}</td>
              <td style={{ padding: 8 }}>{p.fornecedores?.nome}</td>
              <td style={{ padding: 8 }}>{p.etapa_atual}</td>
            </tr>
          ))}
          {filtrados.length === 0 && (
            <tr>
              <td colSpan={6} style={{ padding: 8, color: "#7D7979" }}>
                Nenhum processo encontrado com esses filtros.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
