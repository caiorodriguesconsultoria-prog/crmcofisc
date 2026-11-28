"""Baixa todos os objetos de um bucket do Supabase Storage pra um diretório local.

PROPOSTA — ainda não usado por nenhum workflow (ver .github/workflows/backup-storage-proposto.yml).
Complementa o backup-diario.yml existente, que só cobre o banco (pg_dump) — os
anexos reais (ex. bucket "andamento-anexos") ficam de fora hoje, achado
registrado em docs/audit/GAPS.md e docs/audit/BRANCH_SYNC.md.

Uso: python scripts/backup_storage.py <bucket> <diretorio-destino>

Usa a API REST oficial do Supabase Storage (sem dependência nova — só `requests`,
já disponível em qualquer runner Python padrão do GitHub Actions). Lista cada
objeto, baixa pro destino preservando a estrutura de pastas, e devolve a
contagem total pra o passo seguinte (checksum/manifesto) conferir.

Variáveis de ambiente esperadas:
  SUPABASE_URL              - URL do projeto (ex. https://xxxx.supabase.co)
  SUPABASE_SERVICE_ROLE_KEY - chave service-role (mesma já usada por lib/supabase/service.ts
                              no app; nenhuma credencial nova precisa ser criada só pra isso)
"""

import os
import sys
import requests

TIMEOUT_SEGUNDOS = 30


def listar_objetos(url_base, chave, bucket, prefixo=""):
    resp = requests.post(
        f"{url_base}/storage/v1/object/list/{bucket}",
        headers={"Authorization": f"Bearer {chave}", "apikey": chave},
        json={"prefix": prefixo, "limit": 1000, "sortBy": {"column": "name", "order": "asc"}},
        timeout=TIMEOUT_SEGUNDOS,
    )
    resp.raise_for_status()
    itens = resp.json()
    objetos = []
    for item in itens:
        caminho = f"{prefixo}{item['name']}" if prefixo else item["name"]
        # Pastas vêm sem "id"; arquivos têm "id" — distingue pra recursão.
        if item.get("id") is None:
            objetos.extend(listar_objetos(url_base, chave, bucket, caminho + "/"))
        else:
            objetos.append(caminho)
    return objetos


def baixar_objeto(url_base, chave, bucket, caminho, destino_raiz):
    destino = os.path.join(destino_raiz, caminho)
    os.makedirs(os.path.dirname(destino), exist_ok=True)
    resp = requests.get(
        f"{url_base}/storage/v1/object/{bucket}/{caminho}",
        headers={"Authorization": f"Bearer {chave}", "apikey": chave},
        timeout=TIMEOUT_SEGUNDOS,
    )
    resp.raise_for_status()
    with open(destino, "wb") as f:
        f.write(resp.content)


def main():
    if len(sys.argv) != 3:
        print("Uso: python scripts/backup_storage.py <bucket> <diretorio-destino>")
        sys.exit(1)

    bucket, destino = sys.argv[1], sys.argv[2]
    url_base = os.environ["SUPABASE_URL"].rstrip("/")
    chave = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

    objetos = listar_objetos(url_base, chave, bucket)
    print(f"{len(objetos)} objeto(s) encontrado(s) em '{bucket}'")
    for caminho in objetos:
        baixar_objeto(url_base, chave, bucket, caminho, destino)
        print(f"  baixado: {caminho}")
    print(f"Concluído: {len(objetos)} objeto(s) em {destino}")


if __name__ == "__main__":
    main()
