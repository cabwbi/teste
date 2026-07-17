#!/usr/bin/env python3
"""Baixa, sem interação, as nove planilhas autorizadas do Google Drive."""
from __future__ import annotations

import argparse
import json
import os
from pathlib import Path

from google.oauth2 import service_account
from google.auth.transport.requests import AuthorizedSession

EXPECTED = (
    "controle_financeiro_contratos.xlsx",
    "digitos.xlsx",
    "volumes.xlsx",
    "NL_requisicao.xlsx",
    "Ordem_de_compra_em_assinatura.xlsx",
    "ordem_de_compra.xlsx",
    "requisicoes.xlsx",
    "descricao_OM.xlsx",
    "descricao_projetos.xlsx",
)
SCOPES = ("https://www.googleapis.com/auth/drive.readonly",)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--folder-id", required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    raw = os.environ.get("GDRIVE_SERVICE_ACCOUNT_JSON", "")
    if not raw:
        raise SystemExit("Secret GDRIVE_SERVICE_ACCOUNT_JSON ausente.")
    try:
        info = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise SystemExit("Secret GDRIVE_SERVICE_ACCOUNT_JSON não contém JSON válido.") from exc
    credentials = service_account.Credentials.from_service_account_info(info, scopes=SCOPES)
    session = AuthorizedSession(credentials)
    query = f"'{args.folder_id}' in parents and trashed = false"
    params = {
        "q": query,
        "fields": "files(id,name,mimeType,modifiedTime,size,md5Checksum)",
        "pageSize": 1000,
        "orderBy": "modifiedTime desc",
        "supportsAllDrives": "true",
        "includeItemsFromAllDrives": "true",
    }
    response = session.get("https://www.googleapis.com/drive/v3/files", params=params, timeout=60)
    response.raise_for_status()
    files = response.json().get("files", [])
    by_name: dict[str, list[dict]] = {}
    for item in files:
        if item.get("name", "").lower().endswith(".xlsx"):
            by_name.setdefault(item["name"], []).append(item)
    missing = sorted(set(EXPECTED) - set(by_name))
    extra = sorted(set(by_name) - set(EXPECTED))
    if missing or extra:
        raise SystemExit(f"Conteúdo não autorizado no Drive. Ausentes={missing}; extras={extra}")
    args.output.mkdir(parents=True, exist_ok=True)
    manifest = {"folderId": args.folder_id, "files": []}
    for name in EXPECTED:
        item = sorted(by_name[name], key=lambda x: x.get("modifiedTime", ""), reverse=True)[0]
        target = args.output / name
        with session.get(
            f"https://www.googleapis.com/drive/v3/files/{item['id']}",
            params={"alt": "media", "supportsAllDrives": "true"},
            stream=True,
            timeout=300,
        ) as download:
            download.raise_for_status()
            with target.open("wb") as handle:
                for block in download.iter_content(1024 * 1024):
                    if block:
                        handle.write(block)
        if not target.read_bytes().startswith(b"PK"):
            raise SystemExit(f"Arquivo baixado não é XLSX válido: {name}")
        manifest["files"].append({k: item.get(k) for k in ("id", "name", "modifiedTime", "size", "md5Checksum")})
    (args.output / "input_manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(f"Nove planilhas baixadas em {args.output}")


if __name__ == "__main__":
    main()
