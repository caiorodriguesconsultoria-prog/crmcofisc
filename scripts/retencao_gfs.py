"""Aplica retenção "avô/pai/filho" (GFS) aos backups no Google Drive:
mantém os 7 diários mais recentes, 4 semanais (1 por semana ISO) e
3 mensais (1 por mês) — em vez do corte fixo de 90 dias do script antigo.

PROPOSTA — ver docs/audit/BRANCH_SYNC.md §11 (Fase 00.2) e
.github/workflows/backup-storage-proposto.yml. Substitui a função
`limpa_backups_antigos` de scripts/backup_para_drive.py quando/se esse
workflow for adotado — não apaga nada do fluxo de backup atual
(backup-diario.yml continua com sua própria retenção de 90 dias,
inalterada, até decisão em contrário).

Mesma autenticação de scripts/backup_para_drive.py (reaproveitada, não
duplicada: importa `cliente_drive` de lá).
"""

import re
from collections import OrderedDict
from datetime import datetime, timezone

PADRAO_NOME = re.compile(r"backup-crmcofisc-(\d{4}-\d{2}-\d{2})")
DIARIOS_A_MANTER = 7
SEMANAIS_A_MANTER = 4
MENSAIS_A_MANTER = 3


def listar_backups(drive, pasta_id):
    query = f"'{pasta_id}' in parents and name contains 'backup-crmcofisc-' and trashed = false"
    resposta = drive.files().list(q=query, fields="files(id, name, createdTime)", pageSize=1000).execute()
    itens = []
    for arquivo in resposta.get("files", []):
        m = PADRAO_NOME.search(arquivo["name"])
        if not m:
            continue
        data = datetime.strptime(m.group(1), "%Y-%m-%d").replace(tzinfo=timezone.utc)
        itens.append({"id": arquivo["id"], "name": arquivo["name"], "data": data})
    return sorted(itens, key=lambda x: x["data"], reverse=True)


def selecionar_para_manter(itens):
    """Retorna o conjunto de IDs a preservar, pela regra GFS."""
    manter_ids = set()

    # Diários: os N mais recentes, sem agrupar.
    for item in itens[:DIARIOS_A_MANTER]:
        manter_ids.add(item["id"])

    # Semanais: 1 por semana ISO (o mais recente daquela semana), últimas N semanas distintas.
    vistos_semana: "OrderedDict[tuple, dict]" = OrderedDict()
    for item in itens:
        chave = item["data"].isocalendar()[:2]  # (ano ISO, semana ISO)
        if chave not in vistos_semana:
            vistos_semana[chave] = item
    for item in list(vistos_semana.values())[:SEMANAIS_A_MANTER]:
        manter_ids.add(item["id"])

    # Mensais: 1 por mês (o mais recente daquele mês), últimos N meses distintos.
    vistos_mes: "OrderedDict[tuple, dict]" = OrderedDict()
    for item in itens:
        chave = (item["data"].year, item["data"].month)
        if chave not in vistos_mes:
            vistos_mes[chave] = item
    for item in list(vistos_mes.values())[:MENSAIS_A_MANTER]:
        manter_ids.add(item["id"])

    return manter_ids


def main():
    import os
    import sys

    sys.path.insert(0, "scripts")
    from backup_para_drive import cliente_drive  # import tardio: só exige google-api-python-client no runner real

    pasta_id = os.environ["GOOGLE_DRIVE_FOLDER_ID"]
    drive = cliente_drive()
    itens = listar_backups(drive, pasta_id)
    manter = selecionar_para_manter(itens)

    removidos, preservados = 0, 0
    for item in itens:
        if item["id"] in manter:
            preservados += 1
            continue
        drive.files().delete(fileId=item["id"]).execute()
        print(f"Removido (fora da política GFS): {item['name']}")
        removidos += 1

    print(f"Retenção GFS aplicada: {preservados} preservado(s), {removidos} removido(s)")


if __name__ == "__main__":
    main()
