import Painel from "@/app/_ui/painel";
import Abas from "@/app/processos/[id]/abas";

// Tela temporária da Etapa 5 — prova visual do ControleSegmentado animado
// aplicado às abas Resumo/Andamentos/Relatório do contrato aberto, sem
// precisar de login/Supabase de verdade. Não é uma tela do produto.
export default function ExemploAbasPage() {
  return (
    <Painel titulo="Exemplo — Abas do contrato (Etapa 5)" subtitulo="Prova visual do controle segmentado — tela temporária, não faz parte do produto" maxWidth={900}>
      <Abas
        resumo={<p>Conteúdo do Resumo (dados principais, cronograma etc.)</p>}
        andamentos={<p>Conteúdo dos Andamentos (timeline)</p>}
        relatorio={<p>Conteúdo do Relatório (quadro resumitivo, seções)</p>}
      />
    </Painel>
  );
}
