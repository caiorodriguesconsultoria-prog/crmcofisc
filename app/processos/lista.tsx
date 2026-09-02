"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { card, cor } from "@/lib/theme";
import { corEvento } from "@/lib/cores-evento";
import { BotaoCopiar } from "@/app/_ui/campo";

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
  titular_id: string | null;
  responsavel_atual_id: string | null;
  responsavel: { nome: string } | null;
  processo_eletronico_numero: string | null;
  processo_tags: { tags: { id: string; valor: string; cor: string | null } | null }[];
  proximoAgendamento: { data: string; horario: string | null; periodo: "manha" | "tarde" | null } | null;
};

// Cor de fundo da linha só quando o processo está de fato em cobertura de
// férias (titular e responsável atual são pessoas diferentes) — verde
// quando sou eu quem está cobrindo, âmbar quando é outra pessoa. Processo
// normal (sem cobertura), mesmo que eu seja o responsável de sempre, fica
// sem cor — senão a maioria dos contratos ficaria destacada à toa.
function corDeFundoLinha(p: Processo, minhaPessoaId: string | null): string | undefined {
  if (!minhaPessoaId) return undefined;
  const emCobertura = !!p.titular_id && !!p.responsavel_atual_id && p.titular_id !== p.responsavel_atual_id;
  if (!emCobertura) return undefined;
  return p.responsavel_atual_id === minhaPessoaId ? cor.positivoFundo : cor.atencaoFundo;
}

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
  etapas,
  minhaPessoaId,
}: {
  processos: Processo[];
  coordenacoes: Opcao[];
  formasEntrega: Opcao[];
  eventos: Opcao[];
  responsaveis: Opcao[];
  etapas: Opcao[];
  minhaPessoaId: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [coordenacaoId, setCoordenacaoId] = useState("");
  const [formaEntregaId, setFormaEntregaId] = useState("");
  const [eventoId, setEventoId] = useState(() => searchParams.get("evento") ?? "");
  const [responsavelId, setResponsavelId] = useState("");
  const [etapa, setEtapa] = useState(() => searchParams.get("etapa") ?? "");
  const [busca, setBusca] = useState("");

  const [etapasState, setEtapasState] = useState(etapas);
  const [eventosState, setEventosState] = useState(eventos);
  const [criandoEtapa, setCriandoEtapa] = useState(false);
  const [nomeNovaEtapa, setNomeNovaEtapa] = useState("");
  const [criandoEvento, setCriandoEvento] = useState(false);
  const [nomeNovoEvento, setNomeNovoEvento] = useState("");
  const [corNovoEvento, setCorNovoEvento] = useState("#2F5FDB");
  const [salvandoNovo, setSalvandoNovo] = useState(false);

  useEffect(() => {
    setEtapasState(etapas);
  }, [etapas]);
  useEffect(() => {
    setEventosState(eventos);
  }, [eventos]);

  async function criarEtapa() {
    if (!nomeNovaEtapa.trim()) return;
    setSalvandoNovo(true);
    const { data: nova, error } = await supabase
      .from("kanban_colunas")
      .insert({ nome: nomeNovaEtapa.trim(), ordem: etapasState.length })
      .select("id, nome")
      .single();
    setSalvandoNovo(false);
    if (error || !nova) return;
    setEtapasState((atual) => [...atual, nova]);
    setNomeNovaEtapa("");
    setCriandoEtapa(false);
    router.refresh();
  }

  async function criarEvento() {
    if (!nomeNovoEvento.trim()) return;
    setSalvandoNovo(true);
    const { data: novo, error } = await supabase
      .from("tags")
      .insert({ categoria: "evento", valor: nomeNovoEvento.trim(), ativo: true, cor: corNovoEvento })
      .select("id, valor")
      .single();
    setSalvandoNovo(false);
    if (error || !novo) return;
    setEventosState((atual) => [...atual, novo]);
    setNomeNovoEvento("");
    setCriandoEvento(false);
    router.refresh();
  }

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
          {etapasState.map((e) => (
            <option key={e.id} value={e.nome}>
              {e.nome}
            </option>
          ))}
        </select>
        {criandoEtapa ? (
          <div style={{ display: "flex", gap: 4 }}>
            <input
              autoFocus
              value={nomeNovaEtapa}
              onChange={(e) => setNomeNovaEtapa(e.target.value)}
              placeholder="Nome da etapa"
              style={{ padding: 8, width: 150 }}
            />
            <button type="button" onClick={criarEtapa} disabled={salvandoNovo || !nomeNovaEtapa.trim()}>
              Criar
            </button>
            <button type="button" onClick={() => { setCriandoEtapa(false); setNomeNovaEtapa(""); }}>
              Cancelar
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => setCriandoEtapa(true)} style={{ whiteSpace: "nowrap" }}>
            + Nova Etapa
          </button>
        )}
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
          {eventosState.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.valor}
            </option>
          ))}
        </select>
        {criandoEvento ? (
          <div style={{ display: "flex", gap: 4 }}>
            <input
              autoFocus
              value={nomeNovoEvento}
              onChange={(e) => setNomeNovoEvento(e.target.value)}
              placeholder="Nome do evento"
              style={{ padding: 8, width: 150 }}
            />
            <input
              type="color"
              value={corNovoEvento}
              onChange={(e) => setCorNovoEvento(e.target.value)}
              title="Cor do evento"
              style={{ width: 38, padding: 2 }}
            />
            <button type="button" onClick={criarEvento} disabled={salvandoNovo || !nomeNovoEvento.trim()}>
              Criar
            </button>
            <button type="button" onClick={() => { setCriandoEvento(false); setNomeNovoEvento(""); }}>
              Cancelar
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => setCriandoEvento(true)} style={{ whiteSpace: "nowrap" }}>
            + Novo Evento
          </button>
        )}
        <select value={responsavelId} onChange={(e) => setResponsavelId(e.target.value)}>
          <option value="">Responsável (todos)</option>
          {responsaveis.map((r) => (
            <option key={r.id} value={r.id}>
              {r.nome}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
        <p style={{ margin: 0, color: cor.textoTerciario, fontSize: 12.5 }}>
          {filtrados.length} de {processos.length} processos
        </p>
        {minhaPessoaId && (
          <div style={{ display: "flex", gap: 12, fontSize: 11, color: cor.textoTerciario }}>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: cor.positivoFundo, flex: "none" }} />
              Eu estou cobrindo férias
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: cor.atencaoFundo, flex: "none" }} />
              Cobertura de férias (outra pessoa)
            </span>
          </div>
        )}
      </div>

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
              <th style={{ padding: "10px 12px" }}>Eventos</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((p) => (
              <tr key={p.id} style={{ borderBottom: `1px solid ${cor.borda}`, background: corDeFundoLinha(p, minhaPessoaId) }}>
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
                <td style={{ padding: "10px 12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {p.nup_principal}
                    <BotaoCopiar texto={p.nup_principal} />
                  </div>
                </td>
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
                        {formatarDataAgendamento(p.proximoAgendamento.data)}{" "}
                        {p.proximoAgendamento.horario
                          ? p.proximoAgendamento.horario.slice(0, 5)
                          : p.proximoAgendamento.periodo === "manha"
                            ? "Manhã"
                            : p.proximoAgendamento.periodo === "tarde"
                              ? "Tarde"
                              : ""}
                      </span>
                    )}
                  </div>
                </td>
                <td style={{ padding: "10px 12px" }}>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {p.processo_tags
                      .map((pt) => pt.tags)
                      .filter((t): t is { id: string; valor: string; cor: string | null } => !!t)
                      .map((t) => {
                        const c = corEvento(t.id, t.cor);
                        return (
                          <span
                            key={t.id}
                            style={{
                              fontSize: 10,
                              fontWeight: 600,
                              color: c.texto,
                              background: c.fundo,
                              borderRadius: 7,
                              padding: "2px 7px",
                            }}
                          >
                            {t.valor}
                          </span>
                        );
                      })}
                  </div>
                </td>
              </tr>
            ))}
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: "10px 12px", color: cor.textoTerciario }}>
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
