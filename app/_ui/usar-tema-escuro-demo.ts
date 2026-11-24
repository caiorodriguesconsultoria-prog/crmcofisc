"use client";

import { useEffect, useState } from "react";

// Hook ISOLADO pra alternância de tema — usado só por
// /exemplo-liquid-glass (Etapa 1, prova visual). Não aplica `data-theme`
// em <html> nem em nenhuma tela de produto: o alvo de onde aplicar o
// atributo é escolhido por quem usa o hook (ver a prova visual), então
// nada muda fora dessa tela enquanto o tema escuro não for aprovado e
// estendido ao app inteiro numa etapa futura.
const CHAVE_LOCALSTORAGE = "crm-demo-tema";

export function usarTemaEscuroDemo(): [boolean, (v: boolean) => void] {
  const [escuro, setEscuro] = useState(false);

  useEffect(() => {
    try {
      const salvo = window.localStorage.getItem(CHAVE_LOCALSTORAGE);
      if (salvo === "escuro") {
        setEscuro(true);
      } else if (salvo === "claro") {
        setEscuro(false);
      } else {
        setEscuro(window.matchMedia("(prefers-color-scheme: dark)").matches);
      }
    } catch {
      // localStorage indisponível (ex. navegação privada) — mantém o padrão claro
    }
  }, []);

  function mudar(v: boolean) {
    setEscuro(v);
    try {
      window.localStorage.setItem(CHAVE_LOCALSTORAGE, v ? "escuro" : "claro");
    } catch {
      // idem — falha ao salvar não impede a troca de tema na sessão atual
    }
  }

  return [escuro, mudar];
}
