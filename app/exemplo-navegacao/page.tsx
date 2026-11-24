import BarraTopo from "@/app/_ui/barra-topo";
import Painel from "@/app/_ui/painel";
import { cor } from "@/lib/theme";

// BarraLateral (dentro de BarraTopo) usa useSearchParams (Etapa 4, pra
// saber se a aba de Concluídos está ativa) — sem isso o build tentaria
// pré-renderizar esta página estaticamente e exigiria um Suspense boundary
// à toa. Igual ao /exemplo-painel, esta tela nunca tem motivo pra ser
// estática mesmo.
export const dynamic = "force-dynamic";

// Tela temporária da Etapa 2 do CRM Premium — prova visual da nova
// navegação (sidebar flutuante no desktop, barra inferior Painel/Contratos/
// Dados/Mais no celular), SEM precisar de login/Supabase de verdade (dados
// abaixo são fictícios). Não é uma tela do produto — existe só pra
// aprovação do Caio antes de seguir pra Etapa 3.
export default function ExemploNavegacaoPage() {
  return (
    <div className="crm-painel-fundo crm-fundo-aurora" style={{ flexDirection: "column", minHeight: "100vh" }}>
      <BarraTopo
        contagemProcessosAtivos={17}
        contagemAgendaHoje={3}
        temAlerta
        iniciaisUsuario="CO"
        emailUsuario="caio@cofisc.exemplo"
        atualizadoEm="14:32"
      />
      <Painel titulo="Exemplo — Navegação (Etapa 2)" subtitulo="Prova visual da sidebar/barra inferior novas — tela temporária, não faz parte do produto" maxWidth={1000} fundoAurora>
        <p style={{ color: cor.textoSecundario, fontSize: 13.5 }}>
          Redimensione a janela: acima de 768px aparece a sidebar flutuante à esquerda (Painel/Contratos/Dados, Cadastros
          com Gestores e Fiscais unificado, e "Mais" com Agenda/Assistente/Avisos/Concluídos); abaixo disso some e volta a
          barra inferior com Painel/Contratos/Dados/Mais.
        </p>
      </Painel>
    </div>
  );
}
