import Painel from "@/app/_ui/painel";
import PainelDashboard from "@/app/dashboard/painel-dashboard";

// PainelDashboard cria um cliente Supabase (só usado se pessoaId existir,
// que aqui é null) — sem isso, o build tentaria pré-renderizar esta página
// estaticamente e falharia sem as variáveis de ambiente do Supabase. Nunca
// vai ter dado real nesta tela mesmo, então renderizar sob demanda (nunca
// estático) é o comportamento certo, não só um contorno de build.
export const dynamic = "force-dynamic";

// Tela temporária da Etapa 3 do CRM Premium — prova visual dos indicadores
// novos do Painel (KPIs de entrega atrasada/relatório desatualizado/
// atividades concluídas, widget "Entregas previstas" com seletor 7/15/30),
// com dados fictícios, sem precisar de login/Supabase de verdade. Não é
// uma tela do produto.
export default function ExemploPainelPage() {
  return (
    <Painel titulo="Exemplo — Painel (Etapa 3)" subtitulo="Prova visual dos indicadores novos — tela temporária, não faz parte do produto" maxWidth={1400} fundoAurora>
      <PainelDashboard
        pessoaId={null}
        ordemSalva={null}
        processos={[
          { id: "1", numeroContrato: "234/2026", etapaAtual: "Produção", diasParado: 35 },
          { id: "2", numeroContrato: "294/2026", etapaAtual: "Entrega", diasParado: 5 },
        ]}
        contagemPorEtapa={{ Assinatura: 10, Produção: 4, Entrega: 3, Fiscalização: 2 }}
        contagemPorEvento={{}}
        ativos={17}
        concluidos={5}
        emCoberturaFerias={1}
        divisaoPorCoordenacao={[
          { sigla: "CGECA", total: 8 },
          { sigla: "CGLOG", total: 5 },
          { sigla: "CGEAF", total: 4 },
        ]}
        processosAtividadeHoje={[]}
        eventos={[]}
        etapas={[
          { id: "1", nome: "Assinatura" },
          { id: "2", nome: "Produção" },
          { id: "3", nome: "Entrega" },
          { id: "4", nome: "Fiscalização" },
        ]}
        relatoriosDesatualizados={9}
        contratosComEntregaAtrasada={6}
        entregasPrevistas={[
          { id: "e1", processoId: "1", numeroContrato: "339/2026", numeroParcela: 1, data: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10) },
          { id: "e2", processoId: "2", numeroContrato: "294/2026", numeroParcela: 2, data: new Date(Date.now() + 9 * 86400000).toISOString().slice(0, 10) },
          { id: "e3", processoId: "1", numeroContrato: "305/2026", numeroParcela: 1, data: new Date(Date.now() + 20 * 86400000).toISOString().slice(0, 10) },
        ]}
        atividadesConcluidas7Dias={12}
        tarefasPendentes={4}
      />
    </Painel>
  );
}
