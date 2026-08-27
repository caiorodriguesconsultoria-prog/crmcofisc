"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { botaoPrimario, cor, pill } from "@/lib/theme";
import { corEvento } from "@/lib/cores-evento";
import { BotaoCopiar } from "@/app/_ui/campo";

type Tag = { id: string; valor: string };

type Anexo = {
  id: string;
  nomeArquivo: string;
  caminho: string;
  tamanhoBytes: number | null;
};

type Andamento = {
  id: string;
  tipo: string;
  texto: string;
  data: string;
  sei_numero: string | null;
  incluir_relatorio: boolean;
  autor: { nome: string } | null;
  tags: Tag[];
  agendamentoData: string | null;
  agendamentoHorario: string | null;
  googleEventId: string | null;
  anexos: Anexo[];
};

function formatarTamanho(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const TIPOS = [
  "Ofício Atenção",
  "Notificação Atraso",
  "Autorização Transcurso",
  "Carta Defesa Prévia",
  "Avaria",
  "Conclusão Regular",
  "Outro",
];

function formatarAgendamento(data: string | null, horario: string | null) {
  if (!data) return null;
  const dataFmt = new Date(`${data}T00:00:00`).toLocaleDateString("pt-BR");
  return horario ? `${dataFmt} ${horario.slice(0, 5)}` : dataFmt;
}

export default function Andamentos({
  processoId,
  autorId,
  andamentos,
  tagsAtivas,
}: {
  processoId: string;
  autorId: string | null;
  andamentos: Andamento[];
  tagsAtivas: Tag[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [tipos, setTipos] = useState<string[]>([]);
  const [texto, setTexto] = useState("");
  const [incluirRelatorio, setIncluirRelatorio] = useState(false);
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [arquivosNovos, setArquivosNovos] = useState<FileList | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [carregandoId, setCarregandoId] = useState<string | null>(null);
  const [modalAnexoId, setModalAnexoId] = useState<string | null>(null);
  const [enviandoAnexo, setEnviandoAnexo] = useState(false);
  const [erroAnexo, setErroAnexo] = useState<string | null>(null);

  function alternarTipo(t: string) {
    setTipos((atual) => (atual.includes(t) ? atual.filter((x) => x !== t) : [...atual, t]));
  }

  function alternarTag(tagId: string) {
    setTagIds((atual) => (atual.includes(tagId) ? atual.filter((id) => id !== tagId) : [...atual, tagId]));
  }

  function limparFormulario() {
    setTipos([]);
    setTexto("");
    setIncluirRelatorio(false);
    setTagIds([]);
    setArquivosNovos(null);
    setErro(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setSalvando(true);

    const { data: criado, error } = await supabase
      .from("andamentos")
      .insert({
        processo_id: processoId,
        tipo: tipos.join(", "),
        texto,
        autor_id: autorId,
        incluir_relatorio: incluirRelatorio,
      })
      .select("id")
      .single();

    if (error || !criado) {
      setSalvando(false);
      setErro(error?.message ?? "Erro ao salvar");
      return;
    }

    if (tagIds.length > 0) {
      const { error: erroTags } = await supabase
        .from("andamento_tags")
        .insert(tagIds.map((tagId) => ({ andamento_id: criado.id, tag_id: tagId })));
      if (erroTags) {
        setSalvando(false);
        setErro(erroTags.message);
        return;
      }
    }

    if (arquivosNovos && arquivosNovos.length > 0) {
      await enviarAnexos(criado.id, arquivosNovos);
    }

    setSalvando(false);
    limparFormulario();
    router.refresh();
  }

  async function alternarInclusao(a: Andamento) {
    setErro(null);
    setCarregandoId(a.id);
    const { error } = await supabase
      .from("andamentos")
      .update({ incluir_relatorio: !a.incluir_relatorio })
      .eq("id", a.id);
    setCarregandoId(null);
    if (error) {
      setErro(error.message);
      return;
    }
    router.refresh();
  }

  async function enviarAnexos(andamentoId: string, files: FileList) {
    setErroAnexo(null);
    setEnviandoAnexo(true);
    for (const file of Array.from(files)) {
      const caminho = `${andamentoId}/${Date.now()}-${file.name}`;
      const { error: erroUpload } = await supabase.storage.from("andamento-anexos").upload(caminho, file);
      if (erroUpload) {
        setErroAnexo(erroUpload.message);
        continue;
      }
      const { error: erroInsert } = await supabase.from("andamento_anexos").insert({
        andamento_id: andamentoId,
        nome_arquivo: file.name,
        caminho,
        tamanho_bytes: file.size,
        tipo_mime: file.type || null,
        autor_id: autorId,
      });
      if (erroInsert) setErroAnexo(erroInsert.message);
    }
    setEnviandoAnexo(false);
    router.refresh();
  }

  async function abrirArquivo(caminho: string) {
    const { data } = await supabase.storage.from("andamento-anexos").createSignedUrl(caminho, 300);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  }

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          padding: 12,
          background: cor.fundo,
          borderRadius: 12,
        }}
      >
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Escreva livremente o que aconteceu..."
          required
          style={{ padding: 8, minHeight: 60 }}
        />

        {tagsAtivas.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {tagsAtivas.map((t) => {
              const c = corEvento(t.id);
              const ativa = tagIds.includes(t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => alternarTag(t.id)}
                  style={{
                    ...pill,
                    border: "none",
                    cursor: "pointer",
                    background: ativa ? c.fundo : "rgba(96,93,93,.10)",
                    color: ativa ? c.texto : cor.textoSecundario,
                  }}
                >
                  {t.valor}
                </button>
              );
            })}
          </div>
        )}

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {TIPOS.map((t) => {
            const ativo = tipos.includes(t);
            return (
              <button
                key={t}
                type="button"
                onClick={() => alternarTipo(t)}
                style={{
                  ...pill,
                  border: "none",
                  cursor: "pointer",
                  background: ativo ? cor.destaqueFundo : "rgba(96,93,93,.10)",
                  color: ativo ? cor.destaque : cor.textoSecundario,
                }}
              >
                {t}
              </button>
            );
          })}
        </div>

        <input
          type="file"
          multiple
          onChange={(e) => setArquivosNovos(e.target.files)}
          style={{ fontSize: 12 }}
        />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => setIncluirRelatorio((v) => !v)}
            style={{
              ...pill,
              border: "none",
              cursor: "pointer",
              background: incluirRelatorio ? cor.urgenteFundo : "rgba(96,93,93,.10)",
              color: incluirRelatorio ? cor.urgente : cor.textoSecundario,
            }}
          >
            {incluirRelatorio ? "✓ " : ""}Ocorrência
          </button>
          <button type="submit" disabled={salvando || tipos.length === 0 || !texto.trim()} style={botaoPrimario}>
            {salvando ? "Salvando..." : "Criar andamento"}
          </button>
        </div>

        {erro && <p style={{ color: cor.urgente, margin: 0 }}>{erro}</p>}
      </form>

      <p style={{ fontSize: 11.5, color: cor.textoTerciario, margin: 0 }}>
        Marcado como "Ocorrência" entra na seção 5 (Ocorrências) do Relatório.
      </p>

      <div style={{ display: "flex", flexDirection: "column" }}>
        {andamentos.length === 0 && (
          <span style={{ color: cor.textoTerciario, fontSize: 13 }}>Nenhum andamento registrado.</span>
        )}
        {andamentos.map((a) => (
          <div key={a.id} style={{ borderBottom: `1px solid ${cor.borda}`, padding: "10px 0" }}>
            <div style={{ fontSize: 11.5, color: cor.textoTerciario }}>
              {new Date(a.data).toLocaleString("pt-BR")} · {a.tipo}
              {a.autor?.nome ? ` · ${a.autor.nome}` : ""}
              {a.sei_numero ? ` · SEI ${a.sei_numero}` : ""}
            </div>
            <div style={{ fontSize: 13, marginTop: 3 }}>{a.texto}</div>
            {(a.tags.length > 0 || a.incluir_relatorio || a.agendamentoData) && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                {a.incluir_relatorio && (
                  <span style={{ ...pill, background: cor.urgenteFundo, color: cor.urgente }}>Ocorrência</span>
                )}
                {a.tags.map((t) => {
                  const c = corEvento(t.id);
                  return (
                    <span key={t.id} style={{ ...pill, background: c.fundo, color: c.texto }}>
                      {t.valor}
                    </span>
                  );
                })}
                {a.agendamentoData && (
                  <span style={{ ...pill, background: cor.destaqueFundo, color: cor.destaque }}>
                    {formatarAgendamento(a.agendamentoData, a.agendamentoHorario)}
                  </span>
                )}
              </div>
            )}
            {a.anexos.length > 0 && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                {a.anexos.map((anexo) => (
                  <button
                    key={anexo.id}
                    type="button"
                    onClick={() => abrirArquivo(anexo.caminho)}
                    style={{
                      fontSize: 11,
                      padding: "3px 9px",
                      borderRadius: 8,
                      border: `1px solid ${cor.borda}`,
                      background: "transparent",
                      color: cor.textoSecundario,
                    }}
                  >
                    📎 {anexo.nomeArquivo}
                    {anexo.tamanhoBytes ? ` · ${formatarTamanho(anexo.tamanhoBytes)}` : ""}
                  </button>
                ))}
              </div>
            )}
            <div style={{ display: "flex", gap: 8, marginTop: 6, alignItems: "center", flexWrap: "wrap" }}>
              <button
                type="button"
                disabled={carregandoId === a.id}
                onClick={() => alternarInclusao(a)}
                style={{
                  fontSize: 10.5,
                  padding: "3px 9px",
                  borderRadius: 8,
                  border: "none",
                  background: a.incluir_relatorio ? cor.urgenteFundo : "rgba(96,93,93,.10)",
                  color: a.incluir_relatorio ? cor.urgente : cor.textoSecundario,
                }}
              >
                {a.incluir_relatorio ? "✓ Ocorrência" : "Marcar como ocorrência"}
              </button>
              <BotaoCopiar texto={a.texto} />
              <button
                type="button"
                onClick={() => setModalAnexoId(a.id)}
                style={{ fontSize: 10.5, padding: "2px 8px", color: cor.textoTerciario }}
              >
                + Anexar
              </button>
            </div>
          </div>
        ))}
      </div>

      {modalAnexoId && (
        <div
          onClick={() => setModalAnexoId(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 60,
            background: "rgba(32,31,29,.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: 18,
              width: "100%",
              maxWidth: 420,
              maxHeight: "80vh",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <strong style={{ fontSize: 13 }}>Anexos</strong>
              <button
                type="button"
                onClick={() => setModalAnexoId(null)}
                aria-label="Fechar"
                style={{ width: 26, height: 26, borderRadius: "50%", border: "none", background: "rgba(32,31,29,.08)" }}
              >
                ×
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {(andamentos.find((a) => a.id === modalAnexoId)?.anexos ?? []).length === 0 && (
                <p style={{ fontSize: 12.5, color: cor.textoTerciario, margin: 0 }}>Nenhum anexo ainda.</p>
              )}
              {(andamentos.find((a) => a.id === modalAnexoId)?.anexos ?? []).map((anexo) => (
                <button
                  key={anexo.id}
                  type="button"
                  onClick={() => abrirArquivo(anexo.caminho)}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 12.5,
                    padding: "8px 10px",
                    borderRadius: 10,
                    border: `1px solid ${cor.borda}`,
                    background: "transparent",
                    textAlign: "left",
                  }}
                >
                  <span>📎 {anexo.nomeArquivo}</span>
                  <span style={{ color: cor.textoTerciario, fontSize: 11, flex: "none" }}>
                    {formatarTamanho(anexo.tamanhoBytes)}
                  </span>
                </button>
              ))}
            </div>

            <input
              type="file"
              multiple
              disabled={enviandoAnexo}
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  enviarAnexos(modalAnexoId, e.target.files);
                  e.target.value = "";
                }
              }}
              style={{ fontSize: 12 }}
            />
            {enviandoAnexo && <p style={{ fontSize: 12, color: cor.textoTerciario, margin: 0 }}>Enviando...</p>}
            {erroAnexo && <p style={{ color: cor.urgente, margin: 0, fontSize: 12 }}>{erroAnexo}</p>}
          </div>
        </div>
      )}
    </section>
  );
}
