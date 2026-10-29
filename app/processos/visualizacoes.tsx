"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LayoutGrid, List, Clock } from "lucide-react";
import { cor } from "@/lib/theme";
import ListaProcessos from "./lista";
import KanbanProcessos from "./kanban";
import PorPrazoProcessos from "./por-prazo";
import type { Processo } from "./lista";

type Opcao = { id: string; nome?: string; sigla?: string; valor?: string };

const VISOES = [
  { id: "lista", label: "Lista", Icone: List },
  { id: "kanban", label: "Kanban", Icone: LayoutGrid },
  { id: "prazo", label: "Por prazo", Icone: Clock },
] as const;

type VisaoId = (typeof VISOES)[number]["id"];

// Trilho lateral de visões do Kanban/Lista/Por prazo (Etapa 3 do redesenho)
// — ver design-system/REGRAS.md. A visão escolhida fica na URL (?visao=),
// mesmo padrão que ?etapa=/?evento=/?q= já usavam, pra poder compartilhar o
// link de uma visão específica.
export default function VisualizacoesProcessos({
  processos,
  coordenacoes,
  formasEntrega,
  eventos,
  responsaveis,
  etapas,
  minhaPessoaId,
}: {
  processos: Processo[];
  coordenacoes: Opcao[];
  formasEntrega: Opcao[];
  eventos: Opcao[];
  responsaveis: Opcao[];
  etapas: Opcao[];
  minhaPessoaId: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const visao: VisaoId = (searchParams.get("visao") as VisaoId) ?? "lista";

  function irPara(v: VisaoId) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("visao", v);
    router.push(`${pathname}?${params.toString()}`);
  }

  const etapasKanban = etapas
    .filter((e): e is { id: string; nome: string } => !!e.nome)
    .map((e) => ({ id: e.id, nome: e.nome as string }));

  return (
    <div className="crm-trilho-processos">
      <nav className="crm-trilho-rail" aria-label="Visão dos contratos">
        {VISOES.map(({ id, label, Icone }) => (
          <button
            key={id}
            type="button"
            onClick={() => irPara(id)}
            aria-label={label}
            title={label}
            aria-current={visao === id}
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: visao === id ? cor.escuro : "transparent",
              color: visao === id ? "#fff" : cor.textoTerciario,
            }}
          >
            <Icone size={17} />
          </button>
        ))}
      </nav>

      <nav className="crm-trilho-mobile" aria-label="Visão dos contratos">
        {VISOES.map(({ id, label, Icone }) => (
          <button
            key={id}
            type="button"
            onClick={() => irPara(id)}
            aria-current={visao === id}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: "9px 10px",
              borderRadius: 999,
              border: "none",
              fontSize: 12.5,
              fontWeight: 600,
              background: visao === id ? cor.escuro : "transparent",
              color: visao === id ? "#fff" : cor.textoSecundario,
            }}
          >
            <Icone size={15} />
            {label}
          </button>
        ))}
      </nav>

      <div className="crm-trilho-conteudo">
        {visao === "kanban" && <KanbanProcessos processos={processos} etapas={etapasKanban} />}
        {visao === "prazo" && <PorPrazoProcessos processos={processos} />}
        {visao === "lista" && (
          <ListaProcessos
            processos={processos}
            coordenacoes={coordenacoes}
            formasEntrega={formasEntrega}
            eventos={eventos}
            responsaveis={responsaveis}
            etapas={etapas}
            minhaPessoaId={minhaPessoaId}
          />
        )}
      </div>
    </div>
  );
}
