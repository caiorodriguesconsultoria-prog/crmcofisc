import BarraTopo from "./barra-topo";

// Envelope repetido em toda tela migrada pra BarraTopo (Etapas 2/3/5 e a
// conclusão do rollout no fim do redesenho) — fundo + barra + conteúdo +
// espaço reservado pra barra inferior do celular. Centralizado aqui pra não
// repetir a mesma estrutura em cada page.tsx.
export default function TelaComBarraTopo({
  contagemProcessosAtivos,
  contagemAgendaHoje,
  temAlerta = false,
  iniciaisUsuario,
  emailUsuario,
  atualizadoEm,
  migalha,
  children,
}: {
  contagemProcessosAtivos: number;
  contagemAgendaHoje: number;
  temAlerta?: boolean;
  iniciaisUsuario: string;
  emailUsuario?: string;
  atualizadoEm: string;
  migalha?: string;
  children: React.ReactNode;
}) {
  return (
    // alignItems default (stretch) de propósito — "center" fazia o filho
    // (o .crm-painel-fundo que o Painel renderiza por dentro) encolher pro
    // tamanho do próprio conteúdo em vez de esticar, e aí o width:100%/
    // maxWidth do painel não tinha largura nenhuma pra resolver contra;
    // ficava sempre no tamanho mínimo possível, parecendo tela de celular
    // mesmo em desktop. Centralização já vem do justify-content/margin auto
    // das classes .crm-painel-fundo e .crm-barra-topo.
    <div className="crm-painel-fundo" style={{ flexDirection: "column" }}>
      <BarraTopo
        contagemProcessosAtivos={contagemProcessosAtivos}
        contagemAgendaHoje={contagemAgendaHoje}
        temAlerta={temAlerta}
        iniciaisUsuario={iniciaisUsuario}
        emailUsuario={emailUsuario}
        atualizadoEm={atualizadoEm}
        migalha={migalha}
      />
      {children}
      <div className="crm-barra-topo-espaco-mobile" />
    </div>
  );
}
