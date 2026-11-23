"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cor, raio, movimento } from "@/lib/theme";
import { usarPodeHover } from "./usar-pode-hover";

// Card base da grade bento — cabeçalho igual em todo lugar (título +
// subtítulo cinza + botão redondo opcional no canto), reaproveitado em
// todos os cards do Painel. Ver design-system/REGRAS.md.
export default function CardBento({
  titulo,
  subtitulo,
  acao,
  clicavel,
  pequeno,
  carregando,
  indice = 0,
  children,
  style,
  corAcento,
  vidroClaro,
}: {
  titulo?: string;
  subtitulo?: string;
  acao?: React.ReactNode;
  clicavel?: boolean;
  pequeno?: boolean;
  carregando?: boolean;
  /** Posição do card na grade — usado só pra escalonar a entrada (índice × 40ms). */
  indice?: number;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  /** Faixa colorida (ou degradê — aceita qualquer valor de `background`,
   * não só cor sólida) na lateral esquerda. Usado pro acento do Painel e
   * pro status de entrega em Contratos. */
  corAcento?: string;
  /** Material "vidro" (Liquid Glass) — branco translúcido com blur, sobre
   * o fundo em degradê do Painel ou o fundo claro padrão do resto do
   * sistema. Texto continua com as cores normais do tema. */
  vidroClaro?: boolean;
}) {
  const reduzido = useReducedMotion();
  const podeHover = usarPodeHover();

  return (
    <motion.div
      initial={reduzido ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: movimento.entrada,
        delay: reduzido ? 0 : indice * movimento.escalonado,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={
        !reduzido && podeHover
          ? clicavel
            ? { y: -6, boxShadow: "0 14px 32px rgba(32,31,29,.16)", transition: movimento.springHover }
            : { y: -3, boxShadow: "0 10px 24px rgba(32,31,29,.12)", transition: movimento.springHover }
          : undefined
      }
      whileTap={
        clicavel && !reduzido
          ? { scale: 0.97, transition: movimento.springPress }
          : undefined
      }
      className={vidroClaro ? "crm-cartao-vidro-claro" : undefined}
      style={{
        position: "relative",
        overflow: "hidden",
        // Item de grid precisa de minWidth:0 explícito — sem isso, o
        // conteúdo interno (texto que não quebra) define um mínimo maior
        // que a coluna, e a grade acaba quebrando pra 1 coluna em telas
        // estreitas em vez dos 2-3 widgets lado a lado esperados.
        minWidth: 0,
        background: cor.branco,
        borderRadius: pequeno ? raio.cardPequeno : raio.card,
        border: `1px solid ${cor.borda}`,
        // `pequeno` ganhou padding menor (era 24 fixo pros dois tamanhos) —
        // pedido do Caio: "diminua essas janelas, telas do tamanho de
        // widgets como apps na tela do iPhone" — widget pequeno com o
        // mesmo respiro de um card grande fica com espaço vazio sobrando.
        padding: pequeno ? 14 : 24,
        cursor: clicavel ? "pointer" : undefined,
        boxShadow: "0 0px 0px rgba(32,31,29,0)",
        ...style,
      }}
    >
      {corAcento && <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 5, background: corAcento }} />}
      {(titulo || acao) && (
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: carregando ? 0 : pequeno ? 8 : 14 }}>
          <div style={{ minWidth: 0 }}>
            {titulo && <div style={{ fontSize: pequeno ? 14 : 18, fontWeight: 600, color: cor.texto }}>{titulo}</div>}
            {subtitulo && (
              <div style={{ fontSize: pequeno ? 11.5 : 13, color: cor.textoTerciario, marginTop: 2 }}>
                {subtitulo}
              </div>
            )}
          </div>
          {acao && <div style={{ flex: "none" }}>{acao}</div>}
        </div>
      )}
      {carregando ? <Esqueleto /> : children}
    </motion.div>
  );
}

function Esqueleto() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
      <div style={{ height: 12, borderRadius: 6, background: "rgba(32,31,29,.06)", width: "70%" }} />
      <div style={{ height: 12, borderRadius: 6, background: "rgba(32,31,29,.06)", width: "90%" }} />
      <div style={{ height: 12, borderRadius: 6, background: "rgba(32,31,29,.06)", width: "50%" }} />
    </div>
  );
}
