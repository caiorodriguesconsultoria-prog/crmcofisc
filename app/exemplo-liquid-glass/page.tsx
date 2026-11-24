"use client";

import { useState } from "react";
import Painel from "@/app/_ui/painel";
import ControleSegmentado from "@/app/_ui/controle-segmentado";
import { usarTemaEscuroDemo } from "@/app/_ui/usar-tema-escuro-demo";
import { cor, corEscuro, raio, elevacao, botaoPrimario } from "@/lib/theme";

// Tela temporária da Etapa 1 do CRM Premium (CRM_PREMIUM_SPEC.md) — prova
// visual dos tokens/componentes novos (material Liquid Glass claro/escuro,
// controle segmentado, escala de elevação), ANTES de tocar em qualquer
// tela de produto. Não é uma tela do sistema — existe só pra aprovação do
// Caio antes da Etapa 2 (navegação).
export default function ExemploLiquidGlassPage() {
  const [escuro, mudarEscuro] = usarTemaEscuroDemo();
  const [janela, setJanela] = useState<"7" | "15" | "30">("15");
  const [intenso, setIntenso] = useState(false);

  const classeVidro = `${escuro ? "crm-cartao-vidro-escura" : "crm-cartao-vidro-claro"}${
    intenso ? ` ${escuro ? "crm-cartao-vidro-escura--intenso" : "crm-cartao-vidro-claro--intenso"}` : ""
  }`;
  const paleta = escuro ? corEscuro : cor;

  return (
    <Painel
      titulo="Exemplo — Liquid Glass (Etapa 1)"
      subtitulo="Prova visual dos tokens/componentes novos — tela temporária, não faz parte do produto"
      voltarHref="/dashboard"
      maxWidth={1000}
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", marginBottom: 20 }}>
        <button type="button" style={botaoPrimario} onClick={() => mudarEscuro(!escuro)}>
          Tema: {escuro ? "escuro" : "claro"}
        </button>
        <button
          type="button"
          onClick={() => setIntenso((v) => !v)}
          style={{ fontSize: 13, fontWeight: 600, padding: "10px 18px", borderRadius: 22, border: `1px solid ${cor.borda}`, background: "transparent", cursor: "pointer" }}
        >
          Intensidade: {intenso ? "mobile (~70%)" : "desktop (~50%)"}
        </button>
        <ControleSegmentado
          opcoes={[
            { valor: "7", rotulo: "7 dias" },
            { valor: "15", rotulo: "15 dias" },
            { valor: "30", rotulo: "30 dias" },
          ]}
          valor={janela}
          aoMudar={setJanela}
        />
      </div>

      <div
        className={escuro ? "crm-fundo-aurora-escura" : "crm-fundo-aurora"}
        style={{ borderRadius: raio.painel, padding: 32, position: "relative", minHeight: 420 }}
      >
        {/* Card no nível de elevação "card" */}
        <div
          className={classeVidro}
          style={{
            position: "relative",
            zIndex: elevacao.card,
            borderRadius: raio.card,
            padding: 24,
            maxWidth: 360,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 600, color: paleta.textoTerciario, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Entregas em {janela} dias
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, color: paleta.texto, marginTop: 4 }}>9 contratos</div>
          <div style={{ fontSize: 13, color: paleta.textoSecundario, marginTop: 4 }}>
            Material "card" — elevação {elevacao.card}, {intenso ? "intensidade mobile" : "intensidade desktop"}.
          </div>
        </div>

        {/* "Janela" sobreposta, elevação maior — prova de que duas camadas
           de vidro empilhadas continuam legíveis e com profundidade
           distinguível (não é só o mesmo card duplicado). */}
        <div
          className={classeVidro}
          style={{
            position: "absolute",
            zIndex: elevacao.janela,
            top: 90,
            right: 32,
            borderRadius: raio.painel,
            padding: 24,
            maxWidth: 300,
            boxShadow: "0 24px 60px rgba(0,0,0,.22)",
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 700, color: paleta.texto }}>Contrato 294/2026</div>
          <div style={{ fontSize: 12.5, color: paleta.textoSecundario, marginTop: 6 }}>
            Material "janela" — elevação {elevacao.janela}, acima do card.
          </div>
        </div>
      </div>

      <p style={{ fontSize: 12, color: cor.textoTerciario, marginTop: 16 }}>
        Fallback automático sem blur quando o sistema pede menos transparência
        (<code>prefers-reduced-transparency</code>) e sem animação do controle
        segmentado com <code>prefers-reduced-motion</code> — teste nas preferências
        do navegador/sistema.
      </p>
    </Painel>
  );
}
