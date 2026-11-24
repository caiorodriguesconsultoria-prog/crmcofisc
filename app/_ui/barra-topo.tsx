"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Menu } from "lucide-react";
import { cor, raio } from "@/lib/theme";
import NotificacoesPush from "@/app/_nav/notificacoes-push";
import BarraLateral from "./barra-lateral";

// Navegação de todo o sistema autenticado. Desde a Etapa 2 do CRM Premium
// (CRM_PREMIUM_SPEC.md, seção 4), a navegação principal do DESKTOP passou
// pra sidebar flutuante (BarraLateral, renderizada aqui dentro — qualquer
// tela que já usa <BarraTopo>/<TelaComBarraTopo> ganha a sidebar sem
// precisar mudar o próprio page.tsx). ABAS/MAIS abaixo continuam valendo só
// pra barra INFERIOR do celular (Painel/Contratos/Dados + "Mais"), que não
// mudou de mecanismo, só de conteúdo (Dados entrou no lugar de Agenda, que
// foi pro "Mais" — pedido explícito da especificação: "retirar Agenda do
// menu, não seus dados"). A gaveta lateral ANTIGA (app/_nav/sidebar.tsx,
// de antes do redesenho bento/dashboard) continua desligada — não é a
// mesma coisa que esta sidebar nova.
const ABAS = [
  { href: "/dashboard", label: "Painel" },
  { href: "/processos", label: "Contratos" },
  { href: "/dados", label: "Dados" },
];

// Itens do menu "Mais" do celular — mesmo papel de antes (acesso a tudo que
// não tem botão fixo), conteúdo ajustado: Gestores/Fiscais virou uma entrada
// só (unificação da Etapa 2) e Agenda entrou aqui (saiu do menu principal).
const MAIS = [
  { href: "/processos?aba=concluidos", label: "Concluídos" },
  { href: "/agenda", label: "Agenda" },
  { href: "/assistente", label: "Assistente (IA)" },
  { href: "/avisos", label: "Avisos" },
  { href: "/tags", label: "Tags" },
  { href: "/coordenacoes", label: "Coordenações" },
  { href: "/gestores", label: "Gestores e Fiscais" },
  { href: "/fornecedores", label: "Fornecedores" },
];

export default function BarraTopo({
  contagemProcessosAtivos,
  contagemAgendaHoje,
  temAlerta,
  iniciaisUsuario,
  emailUsuario,
  atualizadoEm,
  migalha,
}: {
  contagemProcessosAtivos: number;
  contagemAgendaHoje: number;
  temAlerta: boolean;
  iniciaisUsuario: string;
  emailUsuario?: string;
  atualizadoEm: string;
  /** Texto da trilha de navegação (2ª linha, só desktop). Padrão: nome da aba ativa. */
  migalha?: string;
}) {
  const pathname = usePathname();
  const [maisAberto, setMaisAberto] = useState(false);
  const abaAtiva = ABAS.find((a) => pathname === a.href || pathname.startsWith(a.href + "/"));

  const contadores: Record<string, number> = {
    "/processos": contagemProcessosAtivos,
    "/agenda": contagemAgendaHoje,
  };

  return (
    <div className="crm-barra-topo">
      <BarraLateral
        contagemProcessosAtivos={contagemProcessosAtivos}
        contagemAgendaHoje={contagemAgendaHoje}
        temAlerta={temAlerta}
        iniciaisUsuario={iniciaisUsuario}
        emailUsuario={emailUsuario}
      />
      <div className="crm-barra-topo-linha1">
        {/* Era um degradê arco-íris (teal/verde/amarelo) — destoava do resto
           do cabeçalho, todo na paleta azul da marca ("+ Novo contrato" já
           usa cor.escuro). Trocado pro mesmo tom escuro, consistente com o
           resto do cabeçalho em vez de um "chrome" colorido isolado. */}
        <span
          style={{
            padding: "6px 14px",
            borderRadius: 10,
            background: cor.escuro,
            color: "#fff",
            fontWeight: 800,
            fontSize: 14,
            letterSpacing: -0.3,
            flex: "none",
          }}
        >
          COFISC
        </span>

        {/* A navegação principal de desktop (pílulas Painel/Contratos/Dados +
           Mais) saiu daqui na Etapa 2 — virou a BarraLateral acima. Esta
           linha agora só aparece de fato no celular (escondida ≥768px via
           CSS), onde ainda é só o cabeçalho (logo + ações); a navegação do
           celular em si é a barra inferior (.crm-barra-topo-mobile), mais
           abaixo neste componente. */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginLeft: "auto", flex: "none" }}>
          <a
            href="/processos/novo"
            className="crm-pilula-hover"
            style={{
              padding: "9px 16px",
              borderRadius: raio.pilula,
              background: cor.escuro,
              color: "#fff",
              fontSize: 14,
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            + Novo contrato
          </a>
          <Link
            href="/avisos"
            aria-label={temAlerta ? "Avisos (há pendências)" : "Avisos"}
            className="crm-barra-topo-alvo-toque"
            style={{ position: "relative", display: "flex", width: 34, height: 34, borderRadius: "50%", alignItems: "center", justifyContent: "center", background: cor.fundo, color: cor.textoSecundario }}
          >
            <Bell size={16} />
            {temAlerta && (
              <span
                style={{ position: "absolute", top: 6, right: 7, width: 8, height: 8, borderRadius: "50%", background: cor.urgente, border: `2px solid ${cor.branco}` }}
              />
            )}
          </Link>
          <div
            aria-label={emailUsuario ? `Logado como ${emailUsuario}` : "Usuário logado"}
            title={emailUsuario}
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: cor.destaqueFundo,
              color: cor.destaque,
              fontSize: 12,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {iniciaisUsuario}
          </div>
        </div>
      </div>

      <div className="crm-barra-topo-linha2">
        <span style={{ color: cor.textoTerciario }}>{migalha ?? abaAtiva?.label ?? "Painel"}</span>
        <span style={{ marginLeft: "auto", color: cor.textoTerciario }}>Atualizado às {atualizadoEm}</span>
      </div>

      <nav className="crm-barra-topo-mobile" aria-label="Navegação principal">
        {ABAS.map((a) => {
          const ativa = pathname === a.href || pathname.startsWith(a.href + "/");
          return (
            <Link
              key={a.href}
              href={a.href}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, flex: 1, textDecoration: "none", color: ativa ? cor.escuro : cor.textoTerciario, fontSize: 11, fontWeight: 600 }}
            >
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: ativa ? cor.escuro : "transparent" }} />
              {a.label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMaisAberto((v) => !v)}
          aria-label="Mais opções"
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, flex: 1, border: "none", background: "transparent", color: cor.textoTerciario, fontSize: 11, fontWeight: 600 }}
        >
          <Menu size={16} />
          Mais
        </button>
      </nav>

      {maisAberto && (
        <>
          <div onClick={() => setMaisAberto(false)} style={{ position: "fixed", inset: 0, zIndex: 44 }} />
          <div className="crm-barra-topo-mais-painel">
            {MAIS.map((m) => (
              <a
                key={m.href}
                href={m.href}
                onClick={() => setMaisAberto(false)}
                style={{ padding: "10px 14px", borderRadius: 9, fontSize: 13.5, fontWeight: 600, color: cor.texto, textDecoration: "none" }}
              >
                {m.label}
              </a>
            ))}
            <div style={{ marginTop: 4, borderTop: `1px solid ${cor.borda}`, paddingTop: 6 }}>
              <NotificacoesPush />
            </div>
            <form action="/logout" method="post" style={{ marginTop: 4, borderTop: `1px solid ${cor.borda}`, paddingTop: 6 }}>
              <button
                type="submit"
                style={{ width: "100%", textAlign: "left", padding: "10px 14px", fontSize: 13.5, fontWeight: 600, color: cor.textoSecundario, background: "transparent", border: "none" }}
              >
                Sair
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
