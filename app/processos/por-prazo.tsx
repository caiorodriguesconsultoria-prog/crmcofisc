"use client";

import { cor } from "@/lib/theme";
import ItemProcesso from "@/app/_ui/item-processo";
import { numeroContratoSemSei } from "@/lib/numero-contrato";
import type { Processo } from "./lista";

// Lista ordenada por data de entrega (Etapa 3 do redesenho) — pensada pro
// crescimento esperado de volume: olhar só quem tem prazo chegando, sem
// precisar abrir o Kanban inteiro ou aplicar filtro manual.
export default function PorPrazoProcessos({ processos }: { processos: Processo[] }) {
  const ordenados = processos
    .filter((p) => p.situacao !== "concluido" && p.prazo_data)
    .sort((a, b) => (a.prazo_data as string).localeCompare(b.prazo_data as string));

  const semPrazo = processos.filter((p) => p.situacao !== "concluido" && !p.prazo_data);

  return (
    <div>
      {ordenados.length === 0 ? (
        <p style={{ color: cor.textoTerciario, fontSize: 13 }}>Nenhum contrato ativo com prazo definido.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {ordenados.map((p) => (
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
            />
          ))}
        </div>
      )}

      {semPrazo.length > 0 && (
        <p style={{ marginTop: 16, fontSize: 12, color: cor.textoTerciario }}>
          + {semPrazo.length} contrato{semPrazo.length > 1 ? "s" : ""} ativo{semPrazo.length > 1 ? "s" : ""} sem prazo definido (fora desta lista).
        </p>
      )}
    </div>
  );
}
