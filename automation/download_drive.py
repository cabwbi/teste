#!/usr/bin/env python3
"""Baixa as dez planilhas e o ZIP-base autorizados do Google Drive."""
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
    "historico_obs.xlsx",
    "descricao_OM.xlsx",
    "descricao_projetos.xlsx",
)
SCOPES = ("https://www.googleapis.com/auth/drive.readonly",)
STEM_ALIASES = {
    "ordem_de_compras": "ordem_de_compra.xlsx",
}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--folder-id", required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--zip-folder-id")
    parser.add_argument("--zip-output", type=Path)
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
    expected_by_stem = {Path(name).stem.lower(): name for name in EXPECTED}
    by_name: dict[str, list[dict]] = {}
    ignored_excel: list[dict] = []
    for item in files:
        source = Path(item.get("name", ""))
        if source.suffix.lower() not in {".xls", ".xlsx"}:
            continue
        canonical = expected_by_stem.get(source.stem.lower()) or STEM_ALIASES.get(source.stem.lower())
        if canonical:
            by_name.setdefault(canonical, []).append(item)
        else:
            ignored_excel.append(item)
    missing = sorted(set(EXPECTED) - set(by_name))
    if missing:
        raise SystemExit(f"Fontes obrigatórias ausentes no Drive: {missing}")
    args.output.mkdir(parents=True, exist_ok=True)
    ignored_latest: dict[str, dict] = {}
    for item in ignored_excel:
        key = Path(item.get("name", "")).name.lower()
        previous = ignored_latest.get(key)
        if previous is None or item.get("modifiedTime", "") > previous.get("modifiedTime", ""):
            ignored_latest[key] = item

    manifest = {
        "folderId": args.folder_id,
        "requiredFiles": list(EXPECTED),
        "files": [],
        "ignoredExcelFiles": [],
    }
    for name in EXPECTED:
        item = sorted(by_name[name], key=lambda x: x.get("modifiedTime", ""), reverse=True)[0]
        source_suffix = Path(item["name"]).suffix.lower()
        target = args.output / f"{Path(name).stem}{source_suffix}"
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
        signature = target.read_bytes()[:8]
        if source_suffix == ".xlsx" and not signature.startswith(b"PK"):
            raise SystemExit(f"Arquivo não é XLSX válido: {item['name']}")
        if source_suffix == ".xls" and not signature.startswith(bytes.fromhex("D0CF11E0A1B11AE1")):
            raise SystemExit(f"Arquivo não é XLS válido: {item['name']}")
        manifest["files"].append({
            **{k: item.get(k) for k in ("id", "name", "modifiedTime", "size", "md5Checksum")},
            "canonicalName": name,
            "downloadedAs": target.name,
        })

    if ignored_latest:
        extras_dir = args.output / "extras"
        extras_dir.mkdir(parents=True, exist_ok=True)
        for item in sorted(ignored_latest.values(), key=lambda x: x.get("name", "").lower()):
            safe_name = Path(item["name"]).name
            source_suffix = Path(safe_name).suffix.lower()
            target = extras_dir / safe_name
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
            signature = target.read_bytes()[:8]
            if source_suffix == ".xlsx" and not signature.startswith(b"PK"):
                raise SystemExit(f"Arquivo Excel adicional não é XLSX válido: {item['name']}")
            if source_suffix == ".xls" and not signature.startswith(bytes.fromhex("D0CF11E0A1B11AE1")):
                raise SystemExit(f"Arquivo Excel adicional não é XLS válido: {item['name']}")
            manifest["ignoredExcelFiles"].append({
                **{k: item.get(k) for k in ("id", "name", "modifiedTime", "size", "md5Checksum")},
                "downloadedAs": str(Path("extras") / safe_name),
                "status": "available_for_future_generator",
            })

    (args.output / "input_manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    if args.zip_folder_id:
        if not args.zip_output:
            raise SystemExit("--zip-output é obrigatório com --zip-folder-id")
        zip_query = f"'{args.zip_folder_id}' in parents and trashed = false"
        zip_params = {
            "q": zip_query,
            "fields": "files(id,name,mimeType,modifiedTime,size,md5Checksum)",
            "pageSize": 1000,
            "orderBy": "modifiedTime desc",
            "supportsAllDrives": "true",
            "includeItemsFromAllDrives": "true",
        }
        zip_response = session.get("https://www.googleapis.com/drive/v3/files", params=zip_params, timeout=60)
        zip_response.raise_for_status()
        zip_files = [
            x for x in zip_response.json().get("files", [])
            if Path(x.get("name", "")).suffix.lower() == ".zip"
        ]
        if not zip_files:
            raise SystemExit("Nenhum ZIP-base encontrado na pasta 02_ZIP_Base.")
        selected = sorted(zip_files, key=lambda x: x.get("modifiedTime", ""), reverse=True)[0]
        with session.get(
            f"https://www.googleapis.com/drive/v3/files/{selected['id']}",
            params={"alt": "media", "supportsAllDrives": "true"},
            stream=True,
            timeout=300,
        ) as download:
            download.raise_for_status()
            args.zip_output.parent.mkdir(parents=True, exist_ok=True)
            with args.zip_output.open("wb") as handle:
                for block in download.iter_content(1024 * 1024):
                    if block:
                        handle.write(block)
        if not args.zip_output.read_bytes()[:4].startswith(b"PK"):
            raise SystemExit("O pacote-base baixado não é um ZIP válido.")
        zip_manifest = {
            "id": selected.get("id"),
            "name": selected.get("name"),
            "modifiedTime": selected.get("modifiedTime"),
            "size": selected.get("size"),
            "md5Checksum": selected.get("md5Checksum"),
        }
        (args.output / "zip_manifest.json").write_text(
            json.dumps(zip_manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )
        print(f"ZIP-base selecionado: {selected['name']} ({selected.get('modifiedTime', '')})")
    if manifest["ignoredExcelFiles"]:
        names = ", ".join(item.get("name", "") for item in manifest["ignoredExcelFiles"])
        print(f"Planilhas Excel adicionais disponíveis em extras/ e ignoradas pelo gerador atual: {names}")
    print(f"Dez planilhas obrigatórias baixadas em {args.output}")


if __name__ == "__main__":
    main()
