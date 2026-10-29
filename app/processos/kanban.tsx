"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cor } from "@/lib/theme";
import ItemProcesso from "@/app/_ui/item-processo";
import { numeroContratoSemSei } from "@/lib/numero-contrato";
import type { Processo } from "./lista";

type Etapa = { id: string; nome: string };

// Kanban das 7 etapas (Etapa 3 do redesenho). Arrastar um card entre colunas
// chama a mesma gravação que já existia (processos.etapa_atual, igual ao
// seletor em app/processos/[id]/painel.tsx) — nenhuma lógica nova de dados,
// só uma forma visual nova de disparar a mesma mutação. Arraste nativo do
// navegador (sem biblioteca nova): mais leve e já acessível por teclado nos
// navegadores que suportam.
export default function KanbanProcessos({ processos, etapas }: { processos: Processo[]; etapas: Etapa[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [arrastandoId, setArrastandoId] = useState<string | null>(null);
  const [colunaSobre, setColunaSobre] = useState<string | null>(null);

  const ativos = processos.filter((p) => p.situacao !== "concluido");
  const porEtapa = new Map<string, Processo[]>();
  for (const et of etapas) porEtapa.set(et.nome, []);
  for (const p of ativos) {
    const lista = porEtapa.get(p.etapa_atual) ?? [];
    lista.push(p);
    porEtapa.set(p.etapa_atual, lista);
  }

  async function moverPara(novaEtapa: string) {
    const id = arrastandoId;
    setArrastandoId(null);
    setColunaSobre(null);
    if (!id) return;
    const processo = ativos.find((p) => p.id === id);
    if (!processo || processo.etapa_atual === novaEtapa) return;
    const { error } = await supabase.from("processos").update({ etapa_atual: novaEtapa }).eq("id", id);
    if (!error) router.refresh();
  }

  return (
    <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 8 }}>
      {etapas.map((et) => (
        <div
          key={et.id}
          onDragOver={(e) => {
            e.preventDefault();
            setColunaSobre(et.nome);
          }}
          onDragLeave={() => setColunaSobre((atual) => (atual === et.nome ? null : atual))}
          onDrop={(e) => {
            e.preventDefault();
            moverPara(et.nome);
          }}
          style={{
            flex: "0 0 240px",
            background: colunaSobre === et.nome ? cor.azulClaroDestaque : cor.fundo,
            borderRadius: 16,
            padding: 12,
            minHeight: 160,
            transition: "background 0.15s ease",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, padding: "0 2px" }}>
            <strong style={{ fontSize: 12.5 }}>{et.nome}</strong>
            <span style={{ fontSize: 11, color: cor.textoTerciario }}>{(porEtapa.get(et.nome) ?? []).length}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {(porEtapa.get(et.nome) ?? []).map((p) => (
              <ItemProcesso
                key={p.id}
                p={{
                  id: p.id,
                  numeroContrato: numeroContratoSemSei(p.numero_contrato),
                  nup: p.nup_principal,
                  objeto: p.objeto,
                  coordenacaoSigla: p.coordenacoes?.sigla ?? null,
                  responsavelNome: p.responsavel?.nome ?? null,
                  prazoData: p.prazo_data,
                  emCobertura: !!p.titular_id && !!p.responsavel_atual_id && p.titular_id !== p.responsavel_atual_id,
                }}
                arrastavel
                aoComecarArraste={() => setArrastandoId(p.id)}
                aoTerminarArraste={() => {
                  setArrastandoId(null);
                  setColunaSobre(null);
                }}
              />
            ))}
            {(porEtapa.get(et.nome) ?? []).length === 0 && (
              <p style={{ fontSize: 11.5, color: cor.textoTerciario, margin: "4px 2px" }}>Nenhum contrato</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
