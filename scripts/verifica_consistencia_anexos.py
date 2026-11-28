"""Confere consistência entre os registros de anexos no banco
(andamento_anexos.caminho) e os arquivos efetivamente baixados do Storage
por scripts/backup_storage.py.

PROPOSTA — ver .github/workflows/backup-storage-proposto.yml e
docs/audit/BRANCH_SYNC.md §13.

Uso: python scripts/verifica_consistencia_anexos.py <diretorio-storage>

Sem dependência nova: usa o `psql` já instalado no workflow (mesmo cliente
do pg_dump) em vez de psycopg2.

Variável de ambiente esperada:
  DATABASE_URL - mesma connection string usada pelo pg_dump
"""

import os
import subprocess
import sys


def caminhos_no_banco(database_url):
    resultado = subprocess.run(
        ["psql", database_url, "-t", "-A", "-c", "select caminho from andamento_anexos"],
        capture_output=True,
        text=True,
        check=True,
    )
    return {linha.strip() for linha in resultado.stdout.splitlines() if linha.strip()}


def caminhos_no_diretorio(diretorio):
    encontrados = set()
    for raiz, _dirs, arquivos in os.walk(diretorio):
        for nome in arquivos:
            caminho_completo = os.path.join(raiz, nome)
            encontrados.add(os.path.relpath(caminho_completo, diretorio))
    return encontrados


def compara(no_banco, no_diretorio):
    """Retorna (faltando_no_backup, sobrando_no_backup) — função pura, testável sem banco/disco reais."""
    faltando = no_banco - no_diretorio
    sobrando = no_diretorio - no_banco
    return faltando, sobrando


def main():
    if len(sys.argv) != 2:
        print("Uso: python scripts/verifica_consistencia_anexos.py <diretorio-storage>", file=sys.stderr)
        sys.exit(1)

    diretorio = sys.argv[1]
    database_url = os.environ["DATABASE_URL"]

    no_banco = caminhos_no_banco(database_url)
    no_diretorio = caminhos_no_diretorio(diretorio)
    faltando, sobrando = compara(no_banco, no_diretorio)

    print(f"Banco: {len(no_banco)} anexo(s) registrado(s)")
    print(f"Backup: {len(no_diretorio)} arquivo(s) baixado(s)")

    if sobrando:
        print(f"Aviso: {len(sobrando)} arquivo(s) no backup sem registro no banco (órfão ou removido):")
        for caminho in sorted(sobrando):
            print(f"  órfão: {caminho}")

    if faltando:
        print(f"ALERTA: {len(faltando)} caminho(s) no banco sem arquivo correspondente no backup:")
        for caminho in sorted(faltando):
            print(f"  faltando: {caminho}")
        sys.exit(1)

    print("Consistência banco/Storage OK")


if __name__ == "__main__":
    main()
