"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { card, cor } from "@/lib/theme";

type DocumentComTransicao = Document & {
  startViewTransition?: (callback: () => void | Promise<void>) => void;
};

// Abre o painel do processo com a animação de "crescer a partir do link"
// (View Transitions API nativa do navegador) quando disponível; navegadores
// sem suporte caem no comportamento normal do Link, sem quebrar nada.
// Não espera a navegação terminar pra resolver a transição (isso deixava o
// clique parecendo travado enquanto os dados do processo carregavam) — só
// dispara a navegação e deixa o React atualizar a tela no tempo normal dele.
function abrirComTransicao(
  e: React.MouseEvent,
  router: ReturnType<typeof useRouter>,
  href: string,
) {
  const doc = document as DocumentComTransicao;
  if (!doc.startViewTransition) return;
  e.preventDefault();
  doc.startViewTransition(() => {
    router.push(href);
  });
}

const ETAPAS = [
  "Ofício de apresentação",
  "Aguardando entrega",
  "Aguardando assinatura",
  "Aguardando pagamento",
  "Aguardando Área Técnica",
];

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
  proximoAgendamento: { data: string; horario: string } | null;
};

function formatarDataAgendamento(data: string) {
  return new Date(`${data}T00:00:00`).toLocaleDateString("pt-BR");
}

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const [coordenacaoId, setCoordenacaoId] = useState("");
  const [formaEntregaId, setFormaEntregaId] = useState("");
  const [eventoId, setEventoId] = useState(() => searchParams.get("evento") ?? "");
  const [responsavelId, setResponsavelId] = useState("");
  const [etapa, setEtapa] = useState(() => searchParams.get("etapa") ?? "");
  const [busca, setBusca] = useState("");

  // Se o usuário já tinha visitado /processos antes, o Next reaproveita essa
  // mesma instância do componente ao clicar num atalho de Atividades (mesma
  // rota, só muda a query string) — sem isso, o useState acima só pega o
  // filtro na primeira vez e cliques seguintes na barra lateral não fazem nada.
  useEffect(() => {
    setEtapa(searchParams.get("etapa") ?? "");
    setEventoId(searchParams.get("evento") ?? "");
  }, [searchParams]);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return processos.filter((p) => {
      if (coordenacaoId && p.coordenacao_id !== coordenacaoId) return false;
      if (formaEntregaId && p.forma_entrega_tag_id !== formaEntregaId) return false;
      if (eventoId && !p.processo_tags.some((pt) => pt.tags?.id === eventoId)) return false;
      if (responsavelId && p.responsavel_atual_id !== responsavelId) return false;
      if (etapa && p.etapa_atual !== etapa) return false;
      if (
        termo &&
        !p.numero_contrato.toLowerCase().includes(termo) &&
        !p.nup_principal.toLowerCase().includes(termo) &&
        !p.objeto.toLowerCase().includes(termo)
      )
        return false;
      return true;
    });
  }, [processos, coordenacaoId, formaEntregaId, eventoId, responsavelId, etapa, busca]);

  return (
    <div>
      <input
        type="search"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar por contrato, NUP ou objeto..."
        style={{ width: "100%", padding: "10px 14px", marginTop: 16 }}
      />

      <div
        style={{
          ...card,
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          marginTop: 10,
          padding: 14,
        }}
      >
        <select value={etapa} onChange={(e) => setEtapa(e.target.value)}>
          <option value="">Etapa (todas)</option>
          {ETAPAS.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
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
                  <Link
                    href={`/processos/${p.id}`}
                    onClick={(e) => abrirComTransicao(e, router, `/processos/${p.id}`)}
                    style={
                      {
                        fontWeight: 600,
                        textDecoration: "none",
                        viewTransitionName: `processo-${p.id}`,
                      } as React.CSSProperties
                    }
                  >
                    {p.numero_contrato}
                  </Link>
                </td>
                <td style={{ padding: "10px 12px" }}>{p.nup_principal}</td>
                <td style={{ padding: "10px 12px" }}>{p.objeto}</td>
                <td style={{ padding: "10px 12px" }}>{p.coordenacoes?.sigla}</td>
                <td style={{ padding: "10px 12px" }}>{p.fornecedores?.nome}</td>
                <td style={{ padding: "10px 12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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
                    {p.proximoAgendamento && (
                      <span style={{ fontSize: 11, color: cor.textoTerciario, whiteSpace: "nowrap" }}>
                        {formatarDataAgendamento(p.proximoAgendamento.data)} {p.proximoAgendamento.horario.slice(0, 5)}
                      </span>
                    )}
                  </div>
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
