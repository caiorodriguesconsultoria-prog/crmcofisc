import PainelAltoModal from "@/app/_ui/painel-alto-modal";
import { carregarProcesso } from "@/app/processos/[id]/conteudo";

export default async function ProcessoModalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { topo, corpo } = await carregarProcesso(id);

  return (
    <PainelAltoModal maxWidth={820} viewTransitionName={`processo-${id}`} topo={topo}>
      {corpo}
    </PainelAltoModal>
  );
}
