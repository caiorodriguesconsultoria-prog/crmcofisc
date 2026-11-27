# Skills, plugins e MCPs — CRM-COFISC (ambiente desta sessão Claude Code)

> Não é parte do repositório — é o ambiente do assistente usado para desenvolver/auditar o projeto. Documentado porque o pedido incluiu "utilize skills pertinentes já instaladas" e pediu avaliação de utilidade/redundância.

## Skills usadas ativamente neste projeto

| Skill | Uso real já feito |
|---|---|
| `performance-engineering` | Framework de auditoria de desempenho usado nas rodadas de medição de CPU/bundle do `/design-lab` (ver `docs/design/TESTS.md`) |
| `metodologia-desenvolvimento-sistemas` | Metodologia de Caio pra desenvolvimento via vibe coding — referência de processo (requisitos→protótipo→arquitetura→segurança→implementação→auditoria→log), compatível com o fluxo real deste projeto (CLAUDE.md, LOG.md) |
| `visual-apps-apple-ios26` | Usada na fase de redesenho (squircle/abaulado nos widgets) |
| `claude-api` | Relevante direto — o projeto chama a API da Anthropic em 5 pontos (ver `AI.md`); útil pra qualquer manutenção futura desses endpoints (migração de modelo, etc.) |
| `code-review` / `security-review` | Disponíveis para revisões futuras de diff — não acionadas nesta auditoria (que é read-only, sem diff a revisar) |
| `dataviz` | Relevante se qualquer gráfico novo for criado (o projeto já usa `recharts` em produção) |

## Skills potencialmente úteis, não usadas nesta auditoria

`accessibility` (WCAG em mockups/telas — complementar aos testes reais já feitos em `docs/design/TESTS.md`), `animation-performance`, `apple-design`, `redesign-existing-projects`, `dieter-rams-principles` — todas relevantes a um projeto com sistema de design próprio em evolução (bento/dashboard + Liquid Glass), mas nenhuma foi necessária para uma auditoria read-only de arquitetura/dado/funcionalidade.

## Skills/MCPs instalados na plataforma, sem relação com este projeto

A sessão carrega um catálogo padrão da plataforma que não é específico do CRM-COFISC — a maioria é irrelevante aqui e não representa redundância real (não compete com nada do projeto, só não se aplica):

- **MCPs de viagem/lazer/produtividade genérica**: `Expedia`, `SlickTrip`, `Tripadvisor`, `Trello`, `Notion`, `Canva`, `Make`, `Zapier`, `Cloudflare_Developer_Platform`, `Anthropic_Economic_Index` — nenhum uso ou sobreposição com o CRM.
- **`Gmail`, `Google_Calendar`, `Google_Drive` (MCPs da plataforma)**: aqui sim vale uma nota de possível confusão — o **próprio CRM** já integra Google Calendar/Tasks/Drive via OAuth próprio (`lib/google-calendar.ts`, ver `INTEGRATIONS.md`). Usar os MCPs da plataforma pra mexer no Google Calendar/Drive do Caio diretamente (fora do fluxo do app) seria uma ação **separada e paralela** à integração do produto — não redundante tecnicamente (contas/escopos distintos), mas um risco de confusão operacional se usada sem cuidado (ex.: um evento criado via MCP não aparece sincronizado no CRM, e vice-versa). Recomendação: preferir sempre o fluxo do próprio app para qualquer ação que deva refletir no CRM.
- **`Supabase` (MCP)**: tem sobreposição de **capacidade** com o acesso direto ao banco que este projeto já usa via `lib/supabase/service.ts` — mas o MCP não foi usado nesta auditoria (toda leitura de schema veio das migrações versionadas, não de uma consulta ao vivo) por ser mais seguro/auditável ler o SQL commitado do que consultar o banco ao vivo numa auditoria "sem alterar dados".
- **`Vercel` (MCP)**: usado nesta auditoria especificamente pra confirmar qual commit está no deploy de produção (ver `STATUS.md`) — não redundante, foi o jeito mais confiável de checar isso.
- **`github` (MCP)**: relevante pro fluxo de PR/branch do projeto; não usado nesta auditoria porque todo o trabalho foi local via `git`.
- **`Claude_Code_Remote` (MCP de sessão)**: infraestrutura da própria ferramenta, não do projeto.

## Conclusão

Nenhuma skill ou MCP precisou ser instalado para esta auditoria — tudo que foi necessário (leitura de arquivo, `git`, Vercel MCP pra checar deploy) já estava disponível. Não há redundância entre skills/MCPs e o próprio produto, exceto a sobreposição de capacidade Google/Supabase descrita acima, que é mais uma questão de **qual caminho usar** do que de duplicidade de ferramenta.
