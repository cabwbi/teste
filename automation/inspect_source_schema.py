#!/usr/bin/env python3
from __future__ import annotations
import json, re, sys
from pathlib import Path
import xlrd

path = Path(sys.argv[1])
wb = xlrd.open_workbook(path, on_demand=True)
report = {"file": path.name, "sheets": []}
keywords = ("saldo", "credito", "crédito", "dispon", "dotacao", "dotação", "empenh", "valor")

for ws in wb.sheets():
    best_row = 0
    best_count = -1
    for r in range(min(ws.nrows, 12)):
        vals = [str(ws.cell_value(r,c)).strip() for c in range(ws.ncols)]
        count = sum(bool(v) for v in vals)
        if count > best_count:
            best_row, best_count = r, count
    headers = [str(ws.cell_value(best_row,c)).strip() for c in range(ws.ncols)]
    candidates = []
    for c,h in enumerate(headers):
        norm = re.sub(r"\s+", " ", h).strip().lower()
        if not norm or not any(k in norm for k in keywords):
            continue
        total = 0.0
        numeric = 0
        for r in range(best_row+1, ws.nrows):
            v = ws.cell_value(r,c)
            if isinstance(v,(int,float)) and not isinstance(v,bool):
                total += float(v); numeric += 1
        candidates.append({"column": h, "numericCells": numeric, "sum": round(total,2)})
    report["sheets"].append({
        "name": ws.name,
        "rows": ws.nrows,
        "cols": ws.ncols,
        "headerRow": best_row + 1,
        "headers": headers,
        "candidateNumericColumns": candidates,
    })
wb.release_resources()
print(json.dumps(report, ensure_ascii=False, indent=2))
