"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import DadosEntrega from "./relatorio/dados-entrega";

type Entrega = {
  id: string;
  local_entrega: string | null;
  quantidade: number | null;
  valor_total_nf: number | null;
  danfe_venda: string | null;
  danfe_remessa: string | null;
  lote: string | null;
  data_fabricacao: string | null;
  data_validade: string | null;
  data_entrega: string | null;
  responsavel: string | null;
  atraso_dias: number | null;
  percentual_transcurso: number | null;
};

export default function EntregasLazy({ processoId }: { processoId: string }) {
  const [entregas, setEntregas] = useState<Entrega[] | null>(null);

  async function carregar() {
    const supabase = createClient();
    const { data } = await supabase
      .from("processo_entregas")
      .select(
        "id, local_entrega, quantidade, valor_total_nf, danfe_venda, danfe_remessa, lote, data_fabricacao, data_validade, data_entrega, responsavel, atraso_dias, percentual_transcurso",
      )
      .eq("processo_id", processoId)
      .order("created_at");
    setEntregas((data ?? []) as Entrega[]);
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [processoId]);

  if (!entregas) {
    return <p style={{ fontSize: 12, color: "#7D7979", marginTop: 20 }}>Carregando…</p>;
  }

  // Esse componente busca os próprios dados (client-side), fora da árvore
  // que o router.refresh() do Next recarrega — sem isso, adicionar/remover
  // uma entrega salvava certo no banco, mas a tabela continuava mostrando
  // a lista antiga até a página ser recarregada de verdade.
  return <DadosEntrega processoId={processoId} entregas={entregas} onSalvo={carregar} />;
}
