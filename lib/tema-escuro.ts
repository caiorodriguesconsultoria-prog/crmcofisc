// Paleta de marrons que o Caio mandou (print de uma conta de design no
// Instagram) + estrutura visual do vídeo "Furniture CRM" (nuvio.on): fundo
// bem escuro, cards claros flutuando sem um container grande por baixo,
// faixa colorida na lateral de cada card pra diferenciar categoria.
// Protótipo isolado só pro Painel (app/dashboard) — NÃO mexe em
// lib/theme.ts nem em nenhuma outra tela, de propósito, até o Caio
// aprovar e decidir se estende pro resto do sistema.
export const corEscura = {
  fundo: "#1A120E",
  fundoCartao: "#FFFFFF",
  texto: "#F3EDE6",
  textoSecundario: "#C9B8A8",
  textoTerciario: "#8A7A6C",
  // Acentos da paleta enviada, do mais escuro ao mais claro (sem o próprio
  // fundo #1A120E, que já é o fundo da página) — ciclam por índice nos
  // cards/KPIs, mesmo padrão que PALETA_VIVA já faz no tema claro.
  acentos: ["#6B4A2E", "#AB8462", "#4A4A46", "#3A2418", "#D5C4AE"],
};
