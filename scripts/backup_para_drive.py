"""Sobe o dump do backup diário para o Google Drive e apaga backups com mais de 90 dias.

Uso: python scripts/backup_para_drive.py <caminho-do-arquivo>

Variáveis de ambiente esperadas:
  GOOGLE_SERVICE_ACCOUNT_KEY - conteúdo JSON da chave da conta de serviço
  GOOGLE_DRIVE_FOLDER_ID     - ID da pasta no Drive compartilhada com a conta de serviço
"""

import json
import os
import sys
from datetime import datetime, timedelta, timezone

from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

SCOPES = ["https://www.googleapis.com/auth/drive.file"]
RETENCAO_DIAS = 90


def cliente_drive():
    chave = json.loads(os.environ["GOOGLE_SERVICE_ACCOUNT_KEY"])
    credenciais = service_account.Credentials.from_service_account_info(chave, scopes=SCOPES)
    return build("drive", "v3", credentials=credenciais)


def sobe_arquivo(drive, caminho, pasta_id):
    nome = os.path.basename(caminho)
    metadados = {"name": nome, "parents": [pasta_id]}
    midia = MediaFileUpload(caminho, mimetype="application/octet-stream", resumable=True)
    arquivo = drive.files().create(body=metadados, media_body=midia, fields="id, name").execute()
    print(f"Enviado para o Drive: {arquivo['name']} (id={arquivo['id']})")


def limpa_backups_antigos(drive, pasta_id):
    limite = datetime.now(timezone.utc) - timedelta(days=RETENCAO_DIAS)
    query = f"'{pasta_id}' in parents and name contains 'backup-crmcofisc-' and trashed = false"
    resposta = drive.files().list(q=query, fields="files(id, name, createdTime)").execute()

    for arquivo in resposta.get("files", []):
        criado_em = datetime.fromisoformat(arquivo["createdTime"].replace("Z", "+00:00"))
        if criado_em < limite:
            drive.files().delete(fileId=arquivo["id"]).execute()
            print(f"Removido backup antigo do Drive: {arquivo['name']}")


def main():
    if len(sys.argv) != 2:
        print("Uso: python scripts/backup_para_drive.py <caminho-do-arquivo>")
        sys.exit(1)

    caminho = sys.argv[1]
    pasta_id = os.environ["GOOGLE_DRIVE_FOLDER_ID"]

    drive = cliente_drive()
    sobe_arquivo(drive, caminho, pasta_id)
    limpa_backups_antigos(drive, pasta_id)


if __name__ == "__main__":
    main()
