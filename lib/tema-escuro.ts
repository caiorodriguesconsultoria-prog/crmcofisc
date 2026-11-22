// Paleta de marrons que o Caio mandou (print de uma conta de design no
// Instagram) + estrutura visual do vídeo "Furniture CRM" (nuvio.on): fundo
// bem escuro, cards claros flutuando sem um container grande por baixo,
// faixa colorida na lateral de cada card pra diferenciar categoria.
// Protótipo isolado só pro Painel (app/dashboard) — NÃO mexe em
// lib/theme.ts nem em nenhuma outra tela, de propósito, até o Caio
// aprovar e decidir se estende pro resto do sistema.
export const corEscura = {
  fundo: "#1A120E",
  texto: "#F3EDE6",
  textoSecundario: "#C9B8A8",
  // Mais clara que a 1ª versão — a original (#8A7A6C) ficava justa demais
  // de contraste depois que o vidro passou a ser escuro tingido em vez de
  // branco (ver vidroFundo abaixo). Texto neutro SEMPRE claro aqui dentro,
  // nunca as cores de texto do tema claro (cor.texto/cor.textoTerciario) —
  // foi exatamente isso que deixou os rótulos ilegíveis na 1ª tentativa.
  textoTerciario: "#A89484",
  borda: "rgba(243,237,230,.12)",
  // Receita do vidro de verdade: escuro e tingido (não branco) — vidro
  // branco sobre fundo escuro vira cinza-lamacento (causa raiz do print
  // que o Caio mandou). Tingido com os próprios tons da paleta, não preto
  // puro, pra manter a sensação de "vidro" e não de caixa opaca.
  vidroFundo: "rgba(40,30,22,.55)",
  vidroBordaTopo: "rgba(243,237,230,.22)",
  vidroBorda: "rgba(243,237,230,.14)",
  // Acentos da paleta enviada, do mais escuro ao mais claro (sem o próprio
  // fundo #1A120E, que já é o fundo da página) — ciclam por índice nos
  // cards/KPIs, mesmo padrão que PALETA_VIVA já faz no tema claro.
  acentos: ["#6B4A2E", "#AB8462", "#4A4A46", "#3A2418", "#D5C4AE"],
};
