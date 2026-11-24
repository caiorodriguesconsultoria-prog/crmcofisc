import { redirect } from "next/navigation";

// CRM Premium, Etapa 4 (navegação — seção 6 do CRM_PREMIUM_SPEC.md):
// Concluídos virou a aba "Concluídos" dentro da própria tela de Contratos
// (app/processos/lista.tsx), que já busca TODOS os contratos (ativos e
// concluídos) numa única consulta — a tela separada que existia aqui ficou
// redundante. Esta rota continua existindo só pra não quebrar link antigo/
// favorito/histórico do navegador — redireciona já com a aba selecionada.
export default function ProcessosConcluidosPage() {
  redirect("/processos?aba=concluidos");
}
