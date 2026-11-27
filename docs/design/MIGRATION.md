# Protótipo → Produção — diferenças, prioridades, riscos e rollback

> Este documento **não migra nada** — é uma análise para apoiar uma decisão futura de Caio sobre o que promover do `/design-lab` para o CRM real. Nenhum componente de produto foi alterado durante as 10 etapas, exceto a tela de login (autorizada explicitamente por Caio, caso único).

## Diferenças protótipo vs. produção

| Aspecto | Protótipo (`/design-lab`) | Produção (`app/dashboard`, `app/_ui/`) |
|---|---|---|
| Dados | 100% fictícios, fixos no código | Supabase real, RLS, via Server Components |
| Material visual | Liquid Glass (vidro translúcido, 3 níveis de opacidade) | Bento/dashboard (`design-system/REGRAS.md`) — cards sólidos ou `.crm-cartao-vidro-claro` |
| Fundo ambiental | SVG + esferas CSS 3D (`AmbientBackground`) | Fundo sólido/aurora (`fundoAurora` em `Painel`) |
| Navegação | `GlassSidebar`/`GlassDock` próprios, duplicam `barra-lateral.tsx` | **Correção (`docs/audit/BRANCH_SYNC.md`)**: `app/_ui/barra-lateral.tsx` existe só na branch de trabalho — produção usa `app/_ui/barra-topo.tsx` (barra superior, sem sidebar); `app/_ui/barra-lateral.tsx` (já existe na branch) |
| Assistente de IA | Botão decorativo → painel simulado (sem rede) | `/assistente` com chat real, streaming, Supabase/API (`/api/assistente`) |
| Autenticação | N/A (login é a única tela real) | Supabase `signInWithPassword`/`signInWithOAuth` — preservada sem alteração |
| Janela de contrato | `GlassWindow`/`GlassSheet` fictícios, 3 abas simplificadas | `/processos/[id]`, com `relatorio/ocorrencias.tsx`, `quadro-resumitivo.tsx` (dezenas de campos reais de metadados contratuais/jurídicos) — **não replicado no protótipo**, julgado fora de escopo por ser dado de negócio específico demais |

## O que já está em produção (não é migração pendente)

- Tela de login (`app/login/page.tsx`, `app/login/_fundo.tsx`): já publicada, usando a classe CSS `.crm-cartao-vidro-claro` (não os componentes React do `/design-lab`). Autenticação, OAuth e regras de acesso preservadas 100% — nenhuma lógica alterada, só a camada visual.

## Prioridades sugeridas (se Caio decidir migrar)

1. **Baixo risco, alto valor imediato — popovers/microinterações** (passo 9): `whileTap` e entrada/saída animada de popover são mudanças pequenas e isoladas; podem ser aplicadas direto nos componentes equivalentes de produção (`barra-topo.tsx`, `controle-segmentado.tsx` — `barra-lateral.tsx` existe só na branch de trabalho, ver `docs/audit/BRANCH_SYNC.md`) sem reescrever nada.
2. **Médio risco — padrão de bottom sheet mobile** (`GlassSheet`, passo 7): útil para qualquer modal/detalhe que hoje só encolhe no mobile em vez de virar um padrão nativo. Resolver primeiro o gap de tablet do dashboard (ver `TESTS.md`) antes de generalizar.
3. **Médio risco — sparklines nos KPIs reais** (passo 4, componente trocado na homologação final para `GlassSparklineSVG`, sem dependência externa): o componente em si é pequeno, mas precisa de dados históricos reais (hoje só existe o valor atual do KPI) — depende de nova consulta/agregação, não só de UI. Migrar fica mais simples agora — não depende mais de `recharts` estar na mesma rota.
4. **Alto risco/esforço — material Liquid Glass completo**: migrar o dashboard inteiro para vidro translúcido é uma mudança visual grande, sujeita à mesma decisão que já existe hoje (dois sistemas visuais, nunca misturados) — exigiria decidir se o bento/dashboard atual é substituído ou se as duas telas continuam coexistindo por mais tempo.
5. **Não recomendado migrar como está — assistente de IA flutuante**: o painel simulado é só prova de conceito visual; a versão real (`/assistente`) já existe e funciona com streaming de verdade. Se for levar o *visual* do painel flutuante para produção, a ligação teria que ser feita com `/api/assistente` de verdade, não com o texto fictício.

## Dependências (status de instalação)

| Pacote | Já em produção? | Observação |
|---|---|---|
| `framer-motion`, `lucide-react` | ✅ sim | Nenhuma dependência nova necessária para migrar a maior parte do sistema |
| `recharts` | ✅ sim (uso próprio, sem relação com o protótipo) | **Não é mais usado em `/design-lab`** desde a homologação final — o sparkline do protótipo foi trocado para SVG puro (`GlassSparklineSVG`), então migrar sparklines pra produção não traz `recharts` como dependência nova nem reforça um uso já existente |
| `@number-flow/react` | ❌ não | Precisaria ser decidido/aprovado para uso em produção (MIT, 25KB, zero deps — baixo risco) |
| `@paper-design/shaders-react` | ❌ não, e **não recomendado adotar** | Testado e revertido por custo de CPU alto em contexto real (ver `TESTS.md`). **Reavaliado na homologação final e mantido instalado** (custo zero fora da rota `shader-teste`, isolado por code-splitting) — não é mais "candidato a remoção", é uma decisão deliberada de manter como ferramenta |

## Riscos identificados

- ~~Gap de responsividade em tablet~~ — **resolvido na homologação final** (terceiro estado de breakpoint no dashboard, testado em 3 motores sem overflow).
- ~~Falta de focus trap no painel de IA~~ — **resolvido na homologação final** (`Tab` cicla dentro do painel, `Escape` fecha, foco retorna ao botão).
- **Duplicação de navegação**: `GlassSidebar`/`GlassDock` reimplementam (não reutilizam) uma estrutura de sidebar (`barra-lateral.tsx`) que **não existe em produção** — produção usa `barra-topo.tsx` (barra superior). Migrar esse visual exigiria decidir primeiro se a navegação real deve mudar de barra superior pra sidebar (decisão de produto em aberto, não confirmada), não só "adaptar o componente real" como se a sidebar já fosse a navegação vigente.
- **Dependência de API real para o assistente** — qualquer versão em produção do painel flutuante depende de `/api/assistente` estar pronto para o volume de uso (hoje é "Fase 1, em teste", conforme já indicado na própria tela real).
- **Teste em dispositivo físico ainda não feito** — a homologação cobriu Chromium/Firefox/WebKit desktop (headless), mas não iOS/Android reais. Baixo risco (os motores mobile reais derivam dos mesmos engines testados), mas não confirmado.
- **Toda migração de schema** (se alguma vier a ser necessária, por exemplo para sparklines históricos) segue a regra já existente do projeto: entregue como `.sql` para Caio rodar manualmente, nunca executada diretamente.

## Rollback

- Nada foi alterado em produção além da tela de login nesta fase — não há "rollback" de protótipo, só a decisão de não promover nada do `/design-lab` daqui para frente, o que não exige nenhuma ação (o protótipo fica isolado e não afeta o build de produção).
- Para a tela de login especificamente: o commit anterior ao redesenho (`9295702^`, mensagem "login: redesenha a tela real seguindo o mockup aprovado") contém a versão anterior da tela, caso seja necessário reverter — a lógica de autenticação é idêntica nos dois lados, então um `git revert` do commit do redesenho é seguro e não afeta dados/sessões.
- Dependências (`@number-flow/react`, `@paper-design/shaders-react`) podem ser desinstaladas (`npm uninstall`) sem efeito colateral em produção, já que nenhum arquivo de produção as importa — só arquivos dentro de `/design-lab`.
