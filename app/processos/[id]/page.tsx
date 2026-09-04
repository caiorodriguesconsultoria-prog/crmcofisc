import PainelAlto from "@/app/_ui/painel-alto";
import { carregarProcesso } from "./conteudo";

export default async function ProcessoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { topo, corpo } = await carregarProcesso(id);

  return (
    <PainelAlto voltarHref="/processos" maxWidth={820} topo={topo}>
      {corpo}
    </PainelAlto>
  );
}
