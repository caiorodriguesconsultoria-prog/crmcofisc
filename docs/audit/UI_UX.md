# UI/UX — CRM-COFISC (AS-IS)

> O sistema de design usado em produção hoje está em `design-system/REGRAS.md` (regras) e `design-system/tokens.css` (referência; fonte real é `lib/theme.ts`) — **não repetido aqui**. Este documento cobre o que a auditoria encontrou especificamente sobre a relação entre produção e `/design-lab`, e um achado de divergência importante.

## Sistema visual em produção: bento/dashboard

Conforme `design-system/REGRAS.md`: grade bento/dashboard, sem Tailwind (estilo inline + `lib/theme.ts` como fonte única de tokens), acento azul único + laranja quente restrito ao card de destaque, sem vidro/blur em produção, componentes em `app/_ui/` reaproveitados (nunca recriados por tela). Regras de responsividade mobile (`100dvh`, campos 16px, toque 44px, `env(safe-area-inset-*)`) e de movimento (`prefers-reduced-motion`, só `transform`/`opacity`) já estabelecidas e em vigor.

## Sistema visual Liquid Glass: só a tela de login (com ressalva — ver `STATUS.md`)

`design-system/LIQUID_GLASS.md` documenta o segundo sistema visual (vidro translúcido), com status de produção declarado como "login em produção, resto em `/design-lab`". **A auditoria desta sessão confirma, via Vercel (`STATUS.md`), que o commit do redesenho do login (`9295702`) não está no deploy de produção atual** — a tela de login redesenhada existe na branch de trabalho, não (ainda) em `origin/main`/produção. Tratar a afirmação "login já em produção" dos documentos anteriores como pendente de confirmação, não como fato consolidado.

## Navegação real de produção: barra superior, não sidebar

Achado da auditoria, relevante porque contradiz documentação anterior desta mesma sessão: a navegação real em produção é uma **barra superior de cápsulas** (`app/_ui/barra-topo.tsx`), não uma gaveta/sidebar lateral. O comentário no próprio arquivo confirma: *"a gaveta lateral antiga (`app/_nav/sidebar.tsx`) foi desligada por completo no fim da Etapa 6 — o arquivo continua existindo só pelo tipo `Atividade` que `app/_nav/grupos-atividades.tsx` ainda usa"*.

`app/_ui/barra-lateral.tsx` (um componente de sidebar) **existe só na branch de trabalho** (`claude/crm-cofisc-conexao-9pot1u`), não em `origin/main` — ou seja, **não está em produção**. Isso significa que a premissa usada em `app/design-lab/CONHECIMENTO.md`/`docs/design/COMPONENTS.md` ao descrever `GlassSidebar` como espelhando "a estrutura real de produção (`app/_ui/barra-lateral.tsx`)" está desatualizada: produção não tem sidebar nenhuma hoje — tem a barra de cápsulas no topo. Recomenda-se, numa próxima atualização de `docs/design/`, corrigir essa referência (fora do escopo desta auditoria, que é só leitura).

## Responsividade em produção

Regras já estabelecidas em `REGRAS.md` (ver acima) — não auditado telas reais individualmente nesta rodada (fora do escopo pedido, que focou arquitetura/dado/funcionalidade); o achado de gap de tablet documentado em `docs/design/TESTS.md` é específico do protótipo `/design-lab`, não confirmado nem refutado em produção por esta auditoria.

## Onde cada coisa vive (resumo)

| Pergunta | Resposta |
|---|---|
| Qual o sistema de design em uso no app real hoje? | Bento/dashboard, `design-system/REGRAS.md` |
| Onde fica o protótipo Liquid Glass? | `/design-lab`, documentado em `docs/design/` |
| A tela de login usa qual sistema? | Liquid Glass — mas só na branch de trabalho, ver ressalva acima |
| Tem sidebar em produção? | Não — barra superior de cápsulas (`barra-topo.tsx`) |
| Componentes de UI são reaproveitados? | Sim, por regra (`app/_ui/`); exceções pontuais existem no protótipo, nunca em produção |
