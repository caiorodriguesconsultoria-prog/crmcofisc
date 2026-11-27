# IA — CRM-COFISC (AS-IS)

> Todas as chamadas de IA são servidor-para-servidor via `@anthropic-ai/sdk`, nunca exposta diretamente ao cliente. Toda rota exige sessão autenticada e checa `process.env.ANTHROPIC_API_KEY` antes de chamar (retorna 503 se ausente). Nenhuma credencial é impressa aqui.

## Pontos de chamada

| Rota | Modelo | Streaming | Função |
|---|---|---|---|
| `app/api/ai/reformular-andamento/route.ts` | `claude-haiku-4-5-20251001` | Não | Reescreve texto informal de andamento em PT-BR formal. Prompt: não inventar/resumir, só corrigir gramática, retornar só o texto reescrito. Entrada: string `texto`. Saída: texto puro, sem JSON |
| `app/api/assistente/route.ts` | `claude-opus-5-5` | Sim (deltas de texto direto num `ReadableStream`) | Assistente de chat ("Fase 1, em teste"). Prompt proíbe inventar dado de contrato; **1 ferramenta**, `buscarHistoricoContrato`, que consulta `processos`/`andamentos`/`processo_tags`/`processo_execucoes` **pelo cliente Supabase da própria sessão do usuário** — RLS garante visibilidade por usuário, sem bypass privilegiado. Entrada validada: máx. 20 mensagens, máx. 2000 caracteres cada. Abort do cliente propaga via `request.signal` (cancela o streaming de verdade, não só descarta) |
| `app/api/processos/extrair-pdf/route.ts` | `claude-haiku-4-5-20251001` | Não | Extrai todo o metadado de contrato (quadro resumitivo) de um PDF/imagem/planilha enviado. Prompt detalhado campo a campo: JSON explícito, regra de não inventar (nulo em vez de), formato de data AAAA-MM-DD, distingue campos de nº SEI de campos de data de publicação PNCP, regras de extração de item/parcela incluindo itens complementares fora da tabela principal. Saída: `JSON.parse` bruto — **sem validação de schema** (zod/ajv) depois do parse |
| `app/api/processos/extrair-pauta/route.ts` | `claude-haiku-4-5-20251001` | Não | Extrai linhas de pauta de distribuição (UF × quantidade × parcela). Mesmas regras de não-inventar/nulo, ignora linhas de totalização |
| `app/api/processos/extrair-entregas/route.ts` | `claude-haiku-4-5-20251001` | Não | Extrai registros de entrega/nota fiscal (DANFE). Instrui explicitamente a NÃO calcular `atraso_dias`/`percentual_transcurso` — esses são derivados no app (`lib/status-entrega.ts`, `lib/entregas-derivados.ts`) |

## Pipeline de anexo compartilhado (`lib/ia-anexo.ts`)

Aceita PDF/PNG/JPEG/WEBP/XLSX/XLS, limite de 4MB (`TAMANHO_MAXIMO_ANEXO_BYTES`, abaixo do teto de corpo de função serverless da Vercel, conforme comentário). PDFs/imagens viram blocos de conteúdo nativos `document`/`image` (base64) pro Claude; **XLSX/XLS não tem suporte nativo da Anthropic, então é convertido pra texto CSV por planilha** via o pacote `xlsx` — este é o **único** lugar onde `xlsx` de fato faz parsing de arquivo (os outros usos de "xlsx" no repo são só o atributo `accept=".xlsx"` do input, alimentando essas mesmas 3 rotas). `extrairTextoResposta` remove blocos de markdown e detecta especificamente `stop_reason === "max_tokens"` pra dar um erro claro de "documento grande demais" em vez de um crash de `JSON.parse`.

## Sinalizador de atualização de modelo

`claude-haiku-4-5-20251001` (datado de outubro/2025) está uma geração atrás do `claude-opus-5-5` usado no assistente — não é um bug, mas é inconsistente; vale checar se o Haiku 5.5 atual cobre a mesma qualidade de extração pelo mesmo custo ou menor.

## Salvaguardas presentes vs. ausentes

**Presentes**: instrução de não-inventar repetida em todo prompt de sistema; sessão exigida; checagem de presença de variável de ambiente.

**Ausentes**: sem validação de schema JSON da saída de extração antes de chegar na UI/banco (depende inteiramente do prompt); sem retry-com-reparo em falha de `JSON.parse` (só mostra o erro); sem limitação de custo/taxa além dos limites de 20 mensagens/2000 caracteres do chat.

## Limitações já assumidas no próprio produto

A tela do assistente (`/assistente`) já exibe "Fase 1, em teste" como aviso ao usuário — não é um achado da auditoria, é uma limitação já declarada pelo produto.
