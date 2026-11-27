# Documentos e relatórios — CRM-COFISC (AS-IS)

## Geração do "PDF"

**Não há biblioteca de renderização de PDF no projeto** (sem `react-pdf`, `puppeteer`, `jsPDF`, `pdfkit`). `app/processos/[id]/relatorio/pdf/page.tsx` + `documento.tsx` (774 linhas) renderizam uma página HTML comum, estilizada com `@media print`, e um botão que chama `window.print()` — o "PDF" é gerado pelo diálogo de impressão do próprio navegador ("Salvar como PDF"), não gerado no servidor.

`page.tsx` busca `processos` (um único select enorme cobrindo todo campo de quadro resumitivo), mais `processo_execucoes`, `processo_pauta_distribuicao`, `processo_entregas`, e `andamentos` filtrados a `incluir_relatorio = true` — confirma que andamentos entram no relatório por opt-in linha a linha (a mesma flag usada em Ocorrências, ver `FEATURES.md`).

## Modelo/template

Não existe um sistema de "modelos" de documento configurável — o layout do relatório é fixo em `documento.tsx`. Placeholders explícitos em 3 pontos ("[Espaço reservado — módulo de pagamentos ainda não construído.]") mostram que o documento já foi desenhado prevendo uma seção futura de pagamentos (ver `FEATURES.md`/`GAPS.md`).

## Referências SEI

**Real e estrutural — não é só uma menção isolada.** Campos como `numero_contrato_sei`, `pregao_eletronico_numero_sei`, `publicacao_dou_pregao_sei`, `publicacao_pncp_pregao_sei`, `ata_registro_precos_numero_sei`, etc. existem como colunas reais no banco (adicionadas nas migrações `0044`, `0045`, `0050`) e são extraídas pelo pipeline de IA (ver `AI.md`) e exibidas no quadro resumitivo + relatório impresso.

**Não há integração ao vivo com a API do SEI** (nenhuma chamada de rede a `sei.saude.gov.br` ou equivalente) — é puramente armazenamento/extração/exibição de números de documento SEI que o usuário já possui em mãos.

## Uso de `xlsx`

Restrito a `lib/ia-anexo.ts`, lendo uma planilha enviada e convertendo pra texto CSV antes de mandar pra IA (ver `AI.md`). **Nenhuma funcionalidade de exportação para Excel foi encontrada** (nenhuma chamada `XLSX.write`/`writeFile` no repositório) — a dependência existe só pro lado de leitura/extração.
