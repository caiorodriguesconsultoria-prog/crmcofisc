"use client";

import { useRef, useState } from "react";
import { card, cor, botaoPrimario } from "@/lib/theme";

type Mensagem = { role: "user" | "assistant"; content: string };

const SUGESTOES = [
  "Me passe o histórico do contrato 294/2026",
  "Resuma a situação do contrato 123/2026",
];

export default function Chat() {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [pergunta, setPergunta] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  async function enviar(texto: string) {
    const pergunta = texto.trim();
    if (!pergunta || carregando) return;
    setErro(null);
    const historico = [...mensagens, { role: "user" as const, content: pergunta }];
    setMensagens(historico);
    setPergunta("");
    setCarregando(true);

    const controller = new AbortController();
    abortRef.current = controller;

    // Resposta transmitida em partes (Performance Engineering, item 19) —
    // o balão do assistente já aparece e cresce conforme o texto chega, em
    // vez de ficar só "Consultando…" até a resposta inteira estar pronta.
    // Adiciona o balão vazio já no histórico e vai completando esse mesmo item.
    setMensagens([...historico, { role: "assistant", content: "" }]);

    try {
      const resp = await fetch("/api/assistente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensagens: historico }),
        signal: controller.signal,
      });
      if (!resp.ok || !resp.body) {
        let mensagemErro = "Não consegui responder agora. Tenta de novo?";
        try {
          const dados = await resp.json();
          if (dados.error === "IA não configurada") mensagemErro = "Assistente ainda não configurado.";
        } catch {
          // resposta sem corpo JSON (ex.: erro antes do stream começar) — mantém a mensagem padrão
        }
        setErro(mensagemErro);
        setMensagens(historico);
        return;
      }

      const leitor = resp.body.getReader();
      const decodificador = new TextDecoder();
      let textoAcumulado = "";
      for (;;) {
        const { done, value } = await leitor.read();
        if (done) break;
        textoAcumulado += decodificador.decode(value, { stream: true });
        setMensagens([...historico, { role: "assistant", content: textoAcumulado }]);
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setErro("Falha de conexão. Tenta de novo?");
      }
    } finally {
      setCarregando(false);
      abortRef.current = null;
    }
  }

  function cancelar() {
    abortRef.current?.abort();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
      <div
        style={{
          ...card,
          minHeight: 280,
          maxHeight: 520,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {mensagens.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <p style={{ color: cor.textoTerciario, fontSize: 13, margin: 0 }}>
              Pergunte sobre um contrato — por enquanto o assistente sabe buscar o histórico completo (dados, cronograma de
              entregas e andamentos recentes) a partir do número do contrato.
            </p>
            {SUGESTOES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => enviar(s)}
                style={{ textAlign: "left", fontSize: 12.5, color: cor.destaque, background: cor.destaqueFundo, border: "none" }}
              >
                {s}
              </button>
            ))}
          </div>
        )}
        {mensagens.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              maxWidth: "85%",
              background: m.role === "user" ? cor.destaque : cor.fundo,
              color: m.role === "user" ? "#fff" : cor.texto,
              borderRadius: 14,
              padding: "10px 14px",
              fontSize: 13.5,
              lineHeight: 1.5,
              whiteSpace: "pre-wrap",
              overflowWrap: "break-word",
            }}
          >
            {m.content || (carregando && i === mensagens.length - 1 ? "…" : m.content)}
          </div>
        ))}
      </div>

      {erro && <p style={{ color: cor.urgente, fontSize: 12.5, margin: 0 }}>{erro}</p>}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (carregando) {
            cancelar();
          } else {
            enviar(pergunta);
          }
        }}
        style={{ display: "flex", gap: 8 }}
      >
        <input
          value={pergunta}
          onChange={(e) => setPergunta(e.target.value)}
          placeholder="Ex.: histórico do contrato 294/2026"
          disabled={carregando}
          style={{ flex: 1, padding: "10px 14px" }}
        />
        <button type="submit" disabled={!carregando && !pergunta.trim()} style={botaoPrimario}>
          {carregando ? "Parar" : "Enviar"}
        </button>
      </form>
    </div>
  );
}
