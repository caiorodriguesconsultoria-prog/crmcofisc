import { notFound } from "next/navigation";
import PainelAltoModal from "@/app/_ui/painel-alto-modal";
import { carregarProcesso } from "@/app/processos/[id]/conteudo";

// "novo" (rota estática /processos/novo) tem o mesmo formato de URL que
// /processos/[id] — o link de "+ Novo processo" usa <a> normal (navegação
// completa) pra nunca cair aqui; isso só fica de proteção extra caso algum
// outro link/atalho leve pra /processos/novo via navegação client-side.
// Usa notFound() (não redirect()) porque redirect() dentro do slot
// interceptado do modal não navega direito — a tela ficava em branco.
export default async function ProcessoModalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (id === "novo") {
    notFound();
  }
  const { topo, corpo } = await carregarProcesso(id);

  return (
    <PainelAltoModal maxWidth={1040} viewTransitionName={`processo-${id}`} topo={topo}>
      {corpo}
    </PainelAltoModal>
  );
}
