import { redirect } from "next/navigation";

// CRM Premium, Etapa 2 (navegação — seção 4 do CRM_PREMIUM_SPEC.md):
// Gestores e Fiscais viraram uma página só, em /gestores, com filtro
// Todos/Gestores/Fiscais. Esta rota continua existindo só pra não quebrar
// link antigo/favorito/histórico do navegador — redireciona já com o
// filtro "Fiscais" selecionado.
export default function FiscaisPage() {
  redirect("/gestores?papel=fiscal");
}
