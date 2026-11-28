"""Gera um manifesto SHA-256 dos artefatos de um backup, pra checar integridade depois.

PROPOSTA — ver .github/workflows/backup-storage-proposto.yml.

Uso: python scripts/gerar_manifesto.py <arquivo1> [arquivo2 ...] > manifesto.sha256

Formato de saída igual ao `sha256sum` padrão (linha "<hash>  <arquivo>"), então
`sha256sum -c manifesto.sha256` já valida sem precisar deste script de volta —
ele só existe pra gerar o manifesto de forma explícita e documentada, com uma
contagem de bytes total impressa em stderr (separado da saída do manifesto,
que precisa ficar limpa pra ir direto num arquivo).
"""

import hashlib
import sys


def sha256_arquivo(caminho, tamanho_bloco=1024 * 1024):
    h = hashlib.sha256()
    with open(caminho, "rb") as f:
        for bloco in iter(lambda: f.read(tamanho_bloco), b""):
            h.update(bloco)
    return h.hexdigest()


def main():
    if len(sys.argv) < 2:
        print("Uso: python scripts/gerar_manifesto.py <arquivo1> [arquivo2 ...]", file=sys.stderr)
        sys.exit(1)

    total_bytes = 0
    for caminho in sys.argv[1:]:
        hash_ = sha256_arquivo(caminho)
        print(f"{hash_}  {caminho}")
        import os
        total_bytes += os.path.getsize(caminho)

    print(f"Manifesto gerado para {len(sys.argv) - 1} arquivo(s), {total_bytes} bytes no total", file=sys.stderr)


if __name__ == "__main__":
    main()
