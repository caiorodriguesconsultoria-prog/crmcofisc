import { redirect } from "next/navigation";
import PainelAltoModal from "@/app/_ui/painel-alto-modal";
import { carregarProcesso } from "@/app/processos/[id]/conteudo";

// "novo" (rota estática /processos/novo) tem o mesmo formato de URL que
// /processos/[id] — sem essa checagem, uma navegação que caia aqui em vez
// de na página estática (prefetch do Link tratando "novo" como um id)
// tentaria buscar um processo com id "novo" e cairia no 404 do notFound().
export default async function ProcessoModalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (id === "novo") {
    redirect("/processos/novo");
  }
  const { topo, corpo } = await carregarProcesso(id);

  return (
    <PainelAltoModal maxWidth={1040} viewTransitionName={`processo-${id}`} topo={topo}>
      {corpo}
    </PainelAltoModal>
  );
}
