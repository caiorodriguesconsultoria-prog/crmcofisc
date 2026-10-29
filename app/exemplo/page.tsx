"use client";

import { useState } from "react";
import { Sparkles, Calendar, Building2 } from "lucide-react";
import Painel from "@/app/_ui/painel";
import CardBento from "@/app/_ui/card-bento";
import Kpi from "@/app/_ui/kpi";
import IndicadorUrgencia from "@/app/_ui/indicador-urgencia";
import TagRotulo from "@/app/_ui/tag-rotulo";
import { LinhaChave } from "@/app/_ui/campo";
import { cor, raio } from "@/lib/theme";

// Tela temporária da Etapa 1 (fundação visual) — mostra cada componente
// novo nos estados normal, carregando e clicável/hover, pra conferir antes
// de usar nas telas de verdade. Não é uma tela do produto.
export default function ExemploPage() {
  const [carregando, setCarregando] = useState(false);

  return (
    <Painel titulo="Exemplo — fundação visual" subtitulo="Etapa 1 do redesenho — tela temporária, não faz parte do produto" voltarHref="/dashboard" maxWidth={1100}>
      <button onClick={() => setCarregando((v) => !v)} style={{ marginBottom: 20 }}>
        {carregando ? "Mostrar conteúdo" : "Simular carregando"}
      </button>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <CardBento titulo="Contratos ativos" indice={0} carregando={carregando}>
          <Kpi rotulo="Total" valor={128} variacao={{ texto: "+4 esta semana", sentido: "positivo" }} />
        </CardBento>
        <CardBento titulo="Vencem em 7 dias" indice={1} carregando={carregando}>
          <Kpi rotulo="Contratos" valor={9} variacao={{ texto: "-2 vs. semana passada", sentido: "positivo" }} />
        </CardBento>
        <CardBento titulo="Com ocorrência" indice={2} carregando={carregando}>
          <Kpi rotulo="Contratos" valor={5} variacao={{ texto: "+1 esta semana", sentido: "negativo" }} />
        </CardBento>
      </div>

      {/* Card escuro de destaque — o único lugar com o acento quente (laranja),
          pra ação do dia. Nunca mais de um por tela. */}
      <CardBento
        indice={3}
        carregando={carregando}
        style={{ background: cor.escuro, border: "none", marginBottom: 24 }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: cor.destaqueQuenteFundo,
              color: cor.destaqueQuente,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flex: "none",
            }}
          >
            <Sparkles size={20} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, color: "rgba(255,255,255,.55)" }}>
              Ação do dia
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#fff", marginTop: 2 }}>
              3 contratos aguardando assinatura há mais de 15 dias
            </div>
          </div>
        </div>
      </CardBento>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 16,
        }}
      >
        <CardBento titulo="Card clicável (hover/pressionado)" subtitulo="Passe o mouse — sobe 4px" indice={4} clicavel carregando={carregando}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
            <Building2 size={18} color={cor.destaque} />
            CT 234/2026 — Blau Farmacêutica
          </div>
        </CardBento>

        <CardBento titulo="Indicador de urgência" indice={5} carregando={carregando}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <IndicadorUrgencia nivel="ok" texto="Entrega em 18/12/2026" />
            <IndicadorUrgencia nivel="atencao" texto="Vence em 3 dias" />
            <IndicadorUrgencia nivel="critico" texto="Vencido há 5 dias" />
          </div>
        </CardBento>

        <CardBento titulo="Rótulo de tag" indice={6} carregando={carregando}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <TagRotulo texto="CGCEAF" corTexto={cor.destaque} />
            <TagRotulo texto="Entrega parcelada" corTexto={cor.verdeEscuro} />
            <TagRotulo texto="Avaria na entrega" corTexto={cor.laranja} />
          </div>
        </CardBento>

        <CardBento titulo="Campo com copiar" subtitulo="Já existia como LinhaChave — reaproveitado" indice={7} carregando={carregando}>
          <div>
            <LinhaChave label="Contrato nº" valor="234/2026" />
            <LinhaChave label="NUP" valor="25000.071704/2026-35" />
          </div>
        </CardBento>

        <CardBento titulo="Agenda de hoje (ícone)" indice={8} carregando={carregando}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
            <Calendar size={18} color={cor.textoTerciario} />
            Nenhum compromisso hoje
          </div>
        </CardBento>

        <CardBento titulo="Cantos pequenos" pequeno subtitulo={`raio.cardPequeno = ${raio.cardPequeno}px`} indice={9} carregando={carregando}>
          <p style={{ fontSize: 12.5, color: cor.textoSecundario, margin: 0 }}>
            Usado quando o card é pequeno/secundário na grade.
          </p>
        </CardBento>
      </div>
    </Painel>
  );
}
