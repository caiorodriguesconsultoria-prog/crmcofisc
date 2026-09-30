// Página pública (sem exigir login) — existe só pra ter uma URL real de
// Política de Privacidade a apontar na tela de consentimento OAuth do
// Google (obrigatória pra publicar o app e evitar o refresh_token expirando
// em 7 dias no modo "Testing").

export const metadata = {
  title: "Política de Privacidade — CRM-COFISC",
};

export default function PoliticaPrivacidade() {
  return (
    <main style={{ maxWidth: 680, margin: "0 auto", padding: "48px 20px", fontFamily: "system-ui, sans-serif", lineHeight: 1.6 }}>
      <h1 style={{ fontSize: 22 }}>Política de Privacidade — CRM-COFISC</h1>
      <p>
        O CRM-COFISC é um sistema de uso interno para gestão de processos de fiscalização de
        contratos da Coordenação-Geral de Fiscalização de Contratos (COFISC/DAF/SCTIE, Ministério
        da Saúde). O acesso é restrito às pessoas autorizadas da equipe.
      </p>
      <h2 style={{ fontSize: 16 }}>Dados tratados</h2>
      <p>
        O sistema armazena dados relativos aos contratos administrativos sob fiscalização
        (números de processo, fornecedores, cronogramas, valores, andamentos) e dados funcionais
        da equipe que utiliza o sistema (nome, matrícula, e-mail institucional).
      </p>
      <h2 style={{ fontSize: 16 }}>Integração com o Google</h2>
      <p>
        O sistema se conecta à Google Agenda (Google Calendar) e ao Google Drive apenas para: (1)
        criar/atualizar eventos de agenda correspondentes a prazos e tarefas já registrados no
        sistema; (2) enviar uma cópia criptografada de backup do banco de dados para uma pasta
        privada do Google Drive da própria equipe. Nenhum dado é compartilhado com terceiros nem
        usado para qualquer finalidade além dessas.
      </p>
      <h2 style={{ fontSize: 16 }}>Contato</h2>
      <p>Dúvidas sobre esta política podem ser enviadas para o e-mail de suporte informado no cadastro do aplicativo.</p>
    </main>
  );
}
