"""Sobe um arquivo pro Google Drive e confere o checksum (md5) devolvido
pela API antes de liberar a etapa de retenção.

PROPOSTA — ver .github/workflows/backup-storage-proposto.yml e
docs/audit/BRANCH_SYNC.md §13: a exclusão de backups antigos
(scripts/retencao_gfs.py) só deve rodar DEPOIS que este script terminar
com sucesso para a nova cópia — nunca antes, pra nunca ficar numa situação
sem nenhum backup íntegro.

Uso: python scripts/sobe_e_verifica.py <arquivo-local> <pasta-id>

Reaproveita cliente_drive() de scripts/backup_para_drive.py (mesma
autenticação, import tardio como em scripts/retencao_gfs.py) — a lógica de
upload+verificação é nova porque backup_para_drive.sobe_arquivo() não
confere checksum depois de subir.
"""

import hashlib
import os
import sys


def md5_arquivo(caminho, tamanho_bloco=1024 * 1024):
    h = hashlib.md5()
    with open(caminho, "rb") as f:
        for bloco in iter(lambda: f.read(tamanho_bloco), b""):
            h.update(bloco)
    return h.hexdigest()


def confere(md5_local, md5_remoto):
    """Função pura, testável sem rede: só compara dois hashes."""
    return bool(md5_remoto) and md5_local == md5_remoto


def main():
    sys.path.insert(0, "scripts")
    from backup_para_drive import cliente_drive  # import tardio: só exige google-api-python-client no runner real
    from googleapiclient.http import MediaFileUpload

    if len(sys.argv) != 3:
        print("Uso: python scripts/sobe_e_verifica.py <arquivo-local> <pasta-id>", file=sys.stderr)
        sys.exit(1)

    caminho, pasta_id = sys.argv[1], sys.argv[2]
    nome = os.path.basename(caminho)
    md5_local = md5_arquivo(caminho)

    drive = cliente_drive()
    midia = MediaFileUpload(caminho, mimetype="application/octet-stream", resumable=True)
    arquivo = drive.files().create(
        body={"name": nome, "parents": [pasta_id]},
        media_body=midia,
        fields="id, name, md5Checksum",
    ).execute()

    md5_remoto = arquivo.get("md5Checksum")
    if not confere(md5_local, md5_remoto):
        if not md5_remoto:
            print("ALERTA: Drive não retornou md5Checksum — não é possível confirmar integridade do upload", file=sys.stderr)
        else:
            print(f"FALHA: checksum local ({md5_local}) difere do Drive ({md5_remoto}) para {nome}", file=sys.stderr)
        sys.exit(1)

    print(f"Upload verificado: {nome} (id={arquivo['id']}) — md5 confere ({md5_local})")


if __name__ == "__main__":
    main()
