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
};

type PautaRow = { uf: string; quantidade: number; data_entrega: string | null };

export default function EntregasLazy({ processoId }: { processoId: string }) {
  const [entregas, setEntregas] = useState<Entrega[] | null>(null);
  const [pauta, setPauta] = useState<PautaRow[]>([]);

  async function carregar() {
    const supabase = createClient();
    const [{ data: entregasData }, { data: pautaData }] = await Promise.all([
      supabase
        .from("processo_entregas")
        .select(
          "id, local_entrega, quantidade, valor_total_nf, danfe_venda, danfe_remessa, lote, data_fabricacao, data_validade, data_entrega, responsavel",
        )
        .eq("processo_id", processoId)
        .order("created_at"),
      // Usada pra calcular atraso (data prevista x data real) e quantidade
      // faltante por UF — ver DadosEntrega.
      supabase.from("processo_pauta_distribuicao").select("uf, quantidade, data_entrega").eq("processo_id", processoId),
    ]);
    setEntregas((entregasData ?? []) as Entrega[]);
    setPauta((pautaData ?? []) as PautaRow[]);
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
  return <DadosEntrega processoId={processoId} entregas={entregas} pauta={pauta} onSalvo={carregar} />;
}
