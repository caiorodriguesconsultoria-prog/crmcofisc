# EXECUTION_STATE — checkpoint de execução contínua

> Criado em 2026-11-28, nesta sessão — não existia antes. Não há registro DT-008 em `docs/DECISIONS.md` nem neste arquivo prévio; ver `docs/audit/BRANCH_SYNC.md` §13 para o impedimento registrado. Daqui em diante, este arquivo é o checkpoint a consultar antes de retomar qualquer tarefa desta linha de trabalho (backup/restauração) — não repetir do início.

## Checkpoint atual

| | |
|---|---|
| Data | 2026-11-28 |
| Branch | `claude/crm-cofisc-conexao-9pot1u` |
| Último commit relevante | `d25f05d` (backup: prepara backup de Storage, manifesto SHA-256, cifragem age e retenção GFS) + alterações desta revisão, ainda não commitadas nesta entrada |
| `origin/main` | `0efae14e81402af9336b48f8969e73a9a61f1a8a` (inalterado) |
| Produção (Vercel) | `0efae14`, inalterada |
| Documento de referência | `docs/audit/BRANCH_SYNC.md` §§11-13 |

## Subtarefas concluídas e validadas (reaproveitáveis, não refazer)

- [x] Restauração isolada de schema (Docker + Supabase CLI via `npx`, zero custo) — 50 migrações, 30 tabelas, RLS 100%, 103 políticas, 2 funções. Resultado em §12. **Não refazer — nada no schema mudou.**
- [x] Mecanismo de manifesto SHA-256 (`scripts/gerar_manifesto.py`) — testado (válido + detecção de corrupção). **Interface não mudou nesta revisão.**
- [x] Mecanismo de cifragem `age` — testado (round-trip íntegro com chave descartável). **Não mudou.**
- [x] Lógica pura de retenção GFS (`selecionar_para_manter`) — testada com 400 dias sintéticos. **Reconfirmada após parametrizar o prefixo (§13); não precisou mudar a função em si.**
- [x] Isolamento de nome/prefixo (`PADRAO_NOME`/`PREFIXO_NOME`) — testado: casa com `crmcofisc-completo-*`, não casa com `backup-crmcofisc-*`.
- [x] Função pura `verifica_consistencia_anexos.compara()` — testada (igual / faltando / órfão).
- [x] Função pura `sobe_e_verifica.confere()` — testada (hash igual / diferente / ausente).
- [x] `py_compile` em todos os scripts novos e afetados — sem erro de sintaxe.
- [x] SHAs de Actions resolvidos via `git ls-remote` real (não inventados): checkout `3d3c42e5aac5ba805825da76410c181273ba90b1` (v7.0.1), setup-python `6d4fd22b20465ccc0f7354476588e8df7c9ca0e0` (v7.1.0), upload-artifact `cf430e030ddbb5b0abf93d22962f4752f3646cd9` (v7.0.2).
- [x] YAML do workflow proposto validado sintaticamente (`yaml.safe_load`).

## Pendente (bloqueado por acesso/decisão, não por falta de trabalho)

- [ ] Qualquer execução real do workflow (`workflow_dispatch` com secrets reais) — decisão e ação de Caio, fora do escopo autorizado aqui.
- [ ] Criação do role `backup_leitura` (`scripts/sql/criar_role_leitura_backup.sql`) — Caio roda manualmente, nunca executado por esta sessão.
- [ ] Criação dos secrets novos: `AGE_PUBLIC_KEY`, `GOOGLE_DRIVE_FOLDER_ID_COMPLETO`, e duplicar `SUPABASE_SERVICE_ROLE_KEY`/`SUPABASE_URL` como GitHub Secrets.
- [ ] Teste de `backup_storage.py`, `verifica_consistencia_anexos.py` e `sobe_e_verifica.py` contra API/banco/Drive reais — sem acesso nesta sessão, só revisão por leitura.
- [ ] Restauração de **dados** reais (não só estrutura) — precisa de dump real, não disponível.
- [ ] Tags de proteção `safety/*` — comandos prontos em §12, push bloqueado por permissão (HTTP 403), pendente de Caio rodar com credencial própria.

## Próxima ação

Nenhuma ação autônoma adicional na linha de trabalho de **backup** sem novo pedido — aguardar decisão de Caio sobre: (a) rodar os comandos de tag de proteção, (b) aprovar o role de leitura e os secrets novos, (c) autorizar um primeiro `workflow_dispatch` de teste do workflow proposto. Ao retomar essa linha, ler este arquivo + `docs/audit/BRANCH_SYNC.md` §13 antes de qualquer novo teste — não repetir a restauração de schema nem os testes de mecanismo já validados acima.

---

## Checkpoint 2026-11-29 — DT-001 a DT-009 formalizadas; início da Fase 00.3

| | |
|---|---|
| Retomado a partir de | commit `5f3068d` (idêntico ao HEAD no início desta entrada — nada ficou pendente de commit) |
| Alteração nesta entrada | `CLAUDE.md`: seção "Decisões técnicas (DT)" — DT-001 a DT-009 registradas; DT-006/DT-007 só apontam pra regras já existentes (sem duplicar texto) |

### Fase 00.3 — preparação de integração isolada sobre `main` atual

Ver `docs/audit/BRANCH_SYNC.md` §7.1 (já documentava a decisão de base — `origin/main` em `0efae14`, não o ancestral comum antigo). Esta fase materializa isso como branch isolada, sem conteúdo de integração ainda (fora de escopo aqui) e sem tocar `main` ou a branch de trabalho existente.
