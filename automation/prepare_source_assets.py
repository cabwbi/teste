#!/usr/bin/env python3
"""Prepara manifesto e downloads auditaveis das fontes Excel do SISCABW."""
from __future__ import annotations

import argparse
import csv
import json
import re
import textwrap
import zipfile
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any, Iterable

import xlrd
from openpyxl import load_workbook
from reportlab.lib.pagesizes import A3, landscape
from reportlab.pdfgen import canvas


def safe_name(value: str) -> str:
    stem = Path(value).stem.lower()
    stem = re.sub(r"[^a-z0-9]+", "_", stem).strip("_")
    return stem or "fonte"


def display_value(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, datetime):
        return value.isoformat(sep=" ", timespec="seconds")
    if isinstance(value, date):
        return value.isoformat()
    return re.sub(r"[\r\n\t]+", " ", str(value)).strip()


def iter_xls(path: Path) -> Iterable[tuple[str, list[list[Any]]]]:
    wb = xlrd.open_workbook(path, on_demand=True)
    try:
        for ws in wb.sheets():
            rows: list[list[Any]] = []
            for ri in range(ws.nrows):
                row: list[Any] = []
                for ci in range(ws.ncols):
                    cell = ws.cell(ri, ci)
                    value = cell.value
                    if cell.ctype == xlrd.XL_CELL_DATE:
                        try:
                            value = xlrd.xldate.xldate_as_datetime(value, wb.datemode)
                        except (OverflowError, ValueError):
                            pass
                    row.append(value)
                rows.append(row)
            yield ws.name, rows
    finally:
        wb.release_resources()


def iter_xlsx(path: Path) -> Iterable[tuple[str, list[list[Any]]]]:
    wb = load_workbook(path, read_only=True, data_only=True)
    try:
        for ws in wb.worksheets:
            ws.reset_dimensions()
            yield ws.title, [list(row) for row in ws.iter_rows(values_only=True)]
    finally:
        wb.close()


def workbook(path: Path) -> list[tuple[str, list[list[Any]]]]:
    return list(iter_xls(path) if path.suffix.lower() == ".xls" else iter_xlsx(path))


def write_csv(path: Path, sheet_rows: list[list[Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.writer(handle)
        for row in sheet_rows:
            writer.writerow([display_value(v) for v in row])


def draw_pdf(source_name: str, sheets: list[tuple[str, list[list[Any]]]], output: Path) -> None:
    output.parent.mkdir(parents=True, exist_ok=True)
    width, height = landscape(A3)
    left, right, top, bottom = 22, 22, 26, 24
    line_height = 7.0
    font_size = 5.2
    wrap_chars = 280
    pdf = canvas.Canvas(str(output), pagesize=landscape(A3), pageCompression=1)
    page_no = 0
    y = 0.0

    def new_page(sheet_name: str) -> None:
        nonlocal page_no, y
        if page_no:
            pdf.showPage()
        page_no += 1
        pdf.setFont("Helvetica-Bold", 8)
        pdf.drawString(left, height - 16, f"{source_name} | Aba: {sheet_name}")
        pdf.setFont("Helvetica", 6)
        pdf.drawRightString(width - right, height - 16, f"Pagina {page_no}")
        pdf.setFont("Helvetica", font_size)
        y = height - top - 8

    for sheet_name, rows in sheets:
        new_page(sheet_name)
        for row_index, row in enumerate(rows, start=1):
            line = " | ".join(display_value(v) for v in row)
            wrapped = textwrap.wrap(
                line, width=wrap_chars, replace_whitespace=False, drop_whitespace=False,
                break_long_words=True, break_on_hyphens=False
            ) or [""]
            for part_index, part in enumerate(wrapped):
                if y < bottom:
                    new_page(sheet_name)
                pdf.drawString(left, y, (f"{row_index}: " if part_index == 0 else "    ") + part)
                y -= line_height
            y -= 1.0
        if not rows:
            pdf.drawString(left, y, "(aba vazia)")
    pdf.save()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--inputs", type=Path, required=True)
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--repo", type=Path, required=True)
    parser.add_argument("--assets", type=Path, required=True)
    parser.add_argument("--release-tag", default="siscabw-fontes-teste")
    parser.add_argument("--repo-full-name", default="cabwbi/teste")
    args = parser.parse_args()

    manifest = json.loads(args.manifest.read_text(encoding="utf-8"))
    all_items: list[dict[str, Any]] = []
    for item in manifest.get("files", []):
        if item.get("downloadedAs"):
            all_items.append({**item, "sourceRole": "required", "_path": args.inputs / item["downloadedAs"]})
    for item in manifest.get("ignoredExcelFiles", []):
        if item.get("downloadedAs"):
            all_items.append({**item, "sourceRole": "additional", "_path": args.inputs / item["downloadedAs"]})
    if not all_items:
        raise SystemExit("Nenhuma fonte Excel disponivel.")

    args.assets.mkdir(parents=True, exist_ok=True)
    generated_utc = datetime.now(timezone.utc).isoformat()
    release_base = f"https://github.com/{args.repo_full_name}/releases/download/{args.release_tag}"
    public_files = []
    used: set[str] = set()

    for item in sorted(all_items, key=lambda x: str(x.get("name", "")).lower()):
        source = Path(item["_path"])
        if not source.is_file():
            raise SystemExit(f"Fonte baixada nao encontrada: {source}")
        sheets = workbook(source)
        stem = safe_name(str(item.get("name") or source.name))
        asset_stem, suffix = stem, 2
        while asset_stem in used:
            asset_stem = f"{stem}_{suffix}"
            suffix += 1
        used.add(asset_stem)
        csv_name, pdf_name = f"{asset_stem}.csv", f"{asset_stem}.pdf"
        write_csv(args.assets / csv_name, sheets[0][1] if sheets else [])
        draw_pdf(str(item.get("name") or source.name), sheets, args.assets / pdf_name)
        public_files.append({
            "name": item.get("name") or source.name,
            "canonicalName": item.get("canonicalName"),
            "sourceRole": item.get("sourceRole"),
            "modifiedTime": item.get("modifiedTime"),
            "pushTime": generated_utc,
            "size": item.get("size"),
            "md5Checksum": item.get("md5Checksum"),
            "sheetCount": len(sheets),
            "csvSheet": sheets[0][0] if sheets else None,
            "csvAsset": csv_name,
            "pdfAsset": pdf_name,
            "csvUrl": f"{release_base}/{csv_name}",
            "pdfUrl": f"{release_base}/{pdf_name}",
        })

    zip_name = "fontes-excel-originais.zip"
    with zipfile.ZipFile(args.assets / zip_name, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
        for item in sorted(all_items, key=lambda x: str(x.get("name", "")).lower()):
            source = Path(item["_path"])
            archive.write(source, arcname=str(item.get("name") or source.name))

    public_manifest = {
        "geradoEmUTC": generated_utc,
        "releaseTag": args.release_tag,
        "releaseBaseUrl": release_base,
        "zipAsset": zip_name,
        "zipUrl": f"{release_base}/{zip_name}",
        "files": public_files,
    }
    for target in (args.repo / "data-sources.json", args.repo / "assets" / "data" / "data-sources.json"):
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(json.dumps(public_manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(json.dumps({"sources": len(public_files), "zip": zip_name, "generatedAt": generated_utc}, ensure_ascii=False))


if __name__ == "__main__":
    main()
